import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '../db/client';
import { deleteRecipePhotoFile, saveRecipePhoto, sweepOrphanPhotos } from '../lib/recipePhoto';
import {
  clicks,
  cookPrepState,
  cooks,
  ingredients,
  prepItems,
  recipes,
  steps,
  tools,
} from '../db/schema';
import {
  StepIngredientsSchema,
  StepSegmentsSchema,
  StepTimersSchema,
  type StepIngredient,
  type StepSegment,
  type StepTimer,
} from '../db/typeguards';
import { getCurrentUserId } from './user';

// User-assignable meal category. Stored as plain text in SQLite (no enum), with
// validation enforced on writes via the RECIPE_CATEGORIES set below. Nullable
// — a recipe with no category set just doesn't appear when filtering by one.
export type RecipeCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'dessert'
  | 'snack'
  | 'drink'
  | 'side'
  | 'appetizer'
  | 'other';

export const RECIPE_CATEGORIES: readonly RecipeCategory[] = [
  'breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'drink', 'side', 'appetizer', 'other',
] as const;

const RECIPE_CATEGORY_SET = new Set<string>(RECIPE_CATEGORIES);

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  snack: 'Snack',
  drink: 'Drink',
  side: 'Side',
  appetizer: 'Appetizer',
  other: 'Other',
};

export type RecipeListItem = {
  id: string;
  title: string;
  duration: string;
  tag: string | null;
  category: RecipeCategory | null;
  tintKey: string | null;
  imageUrl: string | null;
};

export type RecipeDetail = {
  id: string;
  title: string;
  duration: string;
  servings: number;
  tag: string | null;
  category: RecipeCategory | null;
  tintKey: 'terracotta' | 'olive' | null;
  imageUrl: string | null;
  // Null for manual/photo recipes — the detail screen hides "View Original"
  // when there's nothing to open.
  sourceUrl: string | null;
  ingredients: { id: string; amount: string; name: string; prep: string | null }[];
  steps: {
    id: string;
    orderIndex: number;
    segments: StepSegment[];
    ingredients: StepIngredient[];
    timers: StepTimer[];
  }[];
  prepItems: { id: string; label: string; duration: string | null; defaultChecked: boolean }[];
  tools: {
    id: string;
    name: string;
    price: string;
    partner: string;
    affiliateUrl: string | null;
  }[];
};

export async function listRecipes(): Promise<RecipeListItem[]> {
  const userId = await getCurrentUserId();
  const rows = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      duration: recipes.duration,
      tag: recipes.tag,
      category: recipes.category,
      tintKey: recipes.tintKey,
      imageUrl: recipes.imageUrl,
    })
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.updatedAt));

  return rows.map((r) => ({ ...r, category: normalizeCategory(r.category) }));
}

// Coerce any string into a valid RecipeCategory or null. Use this on every
// untrusted input (LLM responses, legacy DB rows, deeplinks) before persisting
// so a bad value can't reach the schema. Lowercased so "Breakfast" / "BREAKFAST"
// from a noisy AI response both resolve.
export function normalizeCategory(value: string | null | undefined): RecipeCategory | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return RECIPE_CATEGORY_SET.has(lower) ? (lower as RecipeCategory) : null;
}

export async function setRecipeCategory(
  recipeId: string,
  category: RecipeCategory | null,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (category !== null && !RECIPE_CATEGORY_SET.has(category)) {
    throw new Error(`[recipes] invalid category: ${category}`);
  }
  await db
    .update(recipes)
    .set({ category, updatedAt: new Date().toISOString() })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
}

/**
 * Store a user-chosen photo for this recipe.
 *
 * `processedUri` must already be a downscaled JPEG in the cache directory (see
 * captureRecipePhotoFile). The file is moved into durable storage and the
 * previous local photo, if any, is deleted. Returns the new `file://` URI so
 * the caller can update its view without a re-fetch.
 */
export async function setRecipePhoto(recipeId: string, processedUri: string): Promise<string> {
  const userId = await getCurrentUserId();

  const owned = await db
    .select({ id: recipes.id, imageUrl: recipes.imageUrl })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
  if (owned.length === 0) throw new Error('[recipes] cannot set photo on a recipe you do not own');

  const uri = saveRecipePhoto(recipeId, processedUri, owned[0].imageUrl);

  await db
    .update(recipes)
    .set({ imageUrl: uri, updatedAt: new Date().toISOString() })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));

  return uri;
}

// Hard-deletes a recipe and everything hanging off it. `PRAGMA foreign_keys =
// ON` is now set at connection open (`src/db/client.ts`), so the schema's
// `onDelete: 'cascade'` declarations would clear these children on their own.
// The explicit deletes are kept deliberately: they are deepest-first and
// therefore FK-safe either way, they keep the delete correct on any pre-pragma
// database, and they document the full blast radius at the call site. Belt and
// braces — do not remove one on the assumption the other is running. Wrapped in
// a transaction so a mid-way failure can't leave a half-deleted recipe behind.
export async function deleteRecipe(recipeId: string): Promise<void> {
  const userId = await getCurrentUserId();

  // Ownership check up front — the delete below is scoped to this user, and
  // bailing early avoids clearing children of someone else's recipe.
  const owned = await db
    .select({ id: recipes.id, imageUrl: recipes.imageUrl })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
  if (owned.length === 0) return;

  // Captured before the row is gone. The file is unlinked after the
  // transaction commits so a rolled-back delete can't orphan the recipe from
  // its photo.
  const localPhoto = owned[0].imageUrl;

  db.transaction((tx) => {
    // cook_prep_state points at both cooks and prep_items, so it goes first.
    tx.delete(cookPrepState)
      .where(
        or(
          inArray(
            cookPrepState.cookId,
            tx.select({ id: cooks.id }).from(cooks).where(eq(cooks.recipeId, recipeId)),
          ),
          inArray(
            cookPrepState.prepItemId,
            tx.select({ id: prepItems.id }).from(prepItems).where(eq(prepItems.recipeId, recipeId)),
          ),
        ),
      )
      .run();
    tx.delete(clicks).where(eq(clicks.recipeId, recipeId)).run();
    tx.delete(cooks).where(eq(cooks.recipeId, recipeId)).run();
    tx.delete(tools).where(eq(tools.recipeId, recipeId)).run();
    tx.delete(prepItems).where(eq(prepItems.recipeId, recipeId)).run();
    tx.delete(steps).where(eq(steps.recipeId, recipeId)).run();
    tx.delete(ingredients).where(eq(ingredients.recipeId, recipeId)).run();
    tx.delete(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
      .run();
  });

  // Cascade doesn't reach the filesystem — without this the JPEG outlives the
  // recipe forever, invisible to the user and to any cleanup path.
  deleteRecipePhotoFile(localPhoto);
}

export async function getRecipe(id: string): Promise<RecipeDetail | null> {
  const result = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: {
      ingredients: { orderBy: (ing, { asc }) => [asc(ing.orderIndex)] },
      steps: { orderBy: (s, { asc }) => [asc(s.orderIndex)] },
      prepItems: { orderBy: (p, { asc }) => [asc(p.orderIndex)] },
      tools: { orderBy: (t, { asc }) => [asc(t.orderIndex)] },
    },
  });

  if (!result) return null;

  const steps = result.steps.map((step) => ({
    id: step.id,
    orderIndex: step.orderIndex,
    segments: StepSegmentsSchema.parse(JSON.parse(step.segmentsJson)),
    ingredients: StepIngredientsSchema.parse(JSON.parse(step.ingredientsJson)),
    timers: StepTimersSchema.parse(JSON.parse(step.timersJson)),
  }));

  return {
    id: result.id,
    title: result.title,
    duration: result.duration,
    servings: result.servings,
    tag: result.tag,
    category: normalizeCategory(result.category),
    tintKey: result.tintKey as 'terracotta' | 'olive' | null,
    imageUrl: result.imageUrl,
    sourceUrl: result.sourceUrl,
    ingredients: result.ingredients.map((ing) => ({
      id: ing.id,
      amount: ing.amount,
      name: ing.name,
      prep: ing.prep,
    })),
    steps,
    prepItems: result.prepItems.map((p) => ({
      id: p.id,
      label: p.label,
      duration: p.duration,
      defaultChecked: p.defaultChecked,
    })),
    tools: result.tools.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
      partner: t.partner,
      affiliateUrl: t.affiliateUrl,
    })),
  };
}

/**
 * One-time-per-launch cleanup of stored photos whose recipe no longer exists.
 *
 * The live id set is read unscoped — every user, soft-deleted rows included —
 * because the two failure modes are not symmetric: keeping a stale file wastes
 * a few hundred kilobytes, while wrongly classifying a live recipe as gone
 * destroys a photo the user chose.
 */
export async function sweepOrphanRecipePhotos(): Promise<number> {
  const rows = await db.select({ id: recipes.id }).from(recipes);
  const removed = sweepOrphanPhotos(new Set(rows.map((r) => r.id)));
  if (removed > 0) {
    console.log(`[recipes] removed ${removed} orphaned photo${removed === 1 ? '' : 's'}`);
  }
  return removed;
}
