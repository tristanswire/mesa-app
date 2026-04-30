import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { recipes } from '../db/schema';
import { getCurrentUserId } from './user';

export async function listRecipes() {
  const userId = await getCurrentUserId();
  return db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.updatedAt));
}

export async function getRecipe(id: string) {
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

  return {
    ...result,
    steps: result.steps.map((step) => ({
      id: step.id,
      orderIndex: step.orderIndex,
      segments: JSON.parse(step.segmentsJson),
      ingredients: JSON.parse(step.ingredientsJson),
      timers: JSON.parse(step.timersJson),
    })),
  };
}
