import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '../db/client';
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

// Hard-deletes a recipe and everything hanging off it. The schema declares
// `onDelete: 'cascade'` on every child FK, but nothing in the app ever runs
// `PRAGMA foreign_keys = ON` (SQLite defaults it OFF), so those cascades never
// fire — each child table has to be cleared explicitly, deepest first, or the
// rows survive as orphans. Wrapped in a transaction so a mid-way failure can't
// leave a half-deleted recipe behind.
export async function deleteRecipe(recipeId: string): Promise<void> {
  const userId = await getCurrentUserId();

  // Ownership check up front — the delete below is scoped to this user, and
  // bailing early avoids clearing children of someone else's recipe.
  const owned = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
  if (owned.length === 0) return;

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
