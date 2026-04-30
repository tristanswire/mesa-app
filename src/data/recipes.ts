import { desc, eq } from 'drizzle-orm';
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

export type RecipeListItem = {
  id: string;
  title: string;
  duration: string;
  tag: string | null;
  tintKey: string | null;
};

export type RecipeDetail = {
  id: string;
  title: string;
  duration: string;
  servings: number;
  tag: string | null;
  tintKey: 'terracotta' | 'olive' | null;
  ingredients: { id: string; amount: string; name: string; prep: string | null }[];
  steps: {
    id: string;
    orderIndex: number;
    segments: StepSegment[];
    ingredients: StepIngredient[];
    timers: StepTimer[];
  }[];
  prepItems: { id: string; label: string; duration: string | null; defaultChecked: boolean }[];
  tools: { id: string; name: string; price: string; partner: string }[];
};

export async function listRecipes(): Promise<RecipeListItem[]> {
  const userId = await getCurrentUserId();
  return db
    .select({
      id: recipes.id,
      title: recipes.title,
      duration: recipes.duration,
      tag: recipes.tag,
      tintKey: recipes.tintKey,
    })
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.updatedAt));
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
    tintKey: result.tintKey as 'terracotta' | 'olive' | null,
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
