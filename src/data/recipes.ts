import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { recipes } from '../db/schema';
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

function normalizeCategory(value: string | null): RecipeCategory | null {
  return value && RECIPE_CATEGORY_SET.has(value) ? (value as RecipeCategory) : null;
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

export async function getHomeData(): Promise<{
  lastCooked: RecipeListItem | null;
  inYourBank: RecipeListItem[];
  worthATry: RecipeListItem[];
}> {
  const all = await listRecipes();
  if (all.length === 0) {
    return { lastCooked: null, inYourBank: [], worthATry: [] };
  }
  return {
    lastCooked: all[0],
    inYourBank: all.slice(0, 2),
    worthATry: all.slice(2, 5),
  };
}
