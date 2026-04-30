import { getCurrentUserId } from '../data/user';
import { MOCK_RECIPES } from '../mocks/recipes';
import { db } from './client';
import { ingredients, prepItems, recipes, steps, tools } from './schema';

export async function seedMockRecipesIfEmpty() {
  const existing = await db.select().from(recipes).limit(1);
  if (existing.length > 0) return;

  const userId = await getCurrentUserId();

  for (const [recipeKey, recipe] of Object.entries(MOCK_RECIPES)) {
    const recipeId = recipeKey;

    await db.insert(recipes).values({
      id: recipeId,
      userId,
      title: recipe.title,
      duration: recipe.duration,
      servings: recipe.servings,
      tag: recipe.tag,
      tintKey: recipe.tintKey,
    });

    const recipeIngredients = recipe.ingredients ?? [];
    for (let i = 0; i < recipeIngredients.length; i++) {
      const ing = recipeIngredients[i];
      await db.insert(ingredients).values({
        id: `${recipeId}_ing_${ing.id}`,
        recipeId,
        amount: ing.amount,
        name: ing.name,
        prep: ing.prep,
        orderIndex: i,
      });
    }

    const recipeSteps = recipe.steps ?? [];
    for (let i = 0; i < recipeSteps.length; i++) {
      const step = recipeSteps[i];
      await db.insert(steps).values({
        id: `${recipeId}_step_${step.id}`,
        recipeId,
        orderIndex: i,
        segmentsJson: JSON.stringify(step.segments),
        ingredientsJson: JSON.stringify(step.ingredients ?? []),
        timersJson: JSON.stringify(step.timers ?? []),
      });
    }

    const recipePrepItems = recipe.prepItems ?? [];
    for (let i = 0; i < recipePrepItems.length; i++) {
      const item = recipePrepItems[i];
      await db.insert(prepItems).values({
        id: `${recipeId}_prep_${item.id}`,
        recipeId,
        label: item.label,
        duration: item.duration,
        defaultChecked: item.defaultChecked ?? false,
        orderIndex: i,
      });
    }

    const recipeTools = recipe.tools ?? [];
    for (let i = 0; i < recipeTools.length; i++) {
      const tool = recipeTools[i];
      await db.insert(tools).values({
        id: `${recipeId}_tool_${tool.id}`,
        recipeId,
        name: tool.name,
        price: tool.price,
        partner: tool.partner,
        orderIndex: i,
      });
    }
  }

  console.log('[seed] Inserted', Object.keys(MOCK_RECIPES).length, 'recipes');
}
