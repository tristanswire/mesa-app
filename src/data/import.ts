import * as Crypto from 'expo-crypto';
import { FunctionsFetchError } from '@supabase/supabase-js';
import { db } from '../db/client';
import { ingredients, prepItems, recipes, steps, tools } from '../db/schema';
import { supabase } from '../supabase/client';
import type { ImportResponse, ParsedRecipe } from '../supabase/sharedTypes';
import { normalizeCategory } from './recipes';
import { getCurrentUserId } from './user';

export type ImportResult =
  | { success: true; recipeId: string }
  | { success: false; error: string };

export async function importRecipeFromUrl(url: string): Promise<ImportResult> {
  try {
    const { data, error } = await supabase.functions.invoke<ImportResponse>('import-recipe', {
      body: { url },
    });

    if (error) {
      console.error('[import] function invoke error', error);
      // FunctionsFetchError means the request never reached the backend at all
      // (DNS failure, offline, or a paused Supabase project) — distinct from an
      // HTTP error response, which means we reached it but it returned 4xx/5xx.
      if (error instanceof FunctionsFetchError) {
        return {
          success: false,
          error: "Mesa's recipe service is temporarily unavailable. Please try again in a few minutes.",
        };
      }
      return {
        success: false,
        error: 'Could not reach the recipe import service. Try a different link.',
      };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error ?? 'Could not parse the recipe.' };
    }

    const recipeId = await saveRecipeToLocalDB(data.recipe, url);
    return { success: true, recipeId };
  } catch (e) {
    console.error('[import] unexpected error', e);
    return { success: false, error: 'Something went wrong.' };
  }
}

async function saveRecipeToLocalDB(parsed: ParsedRecipe, sourceUrl: string): Promise<string> {
  const userId = await getCurrentUserId();
  const recipeId = Crypto.randomUUID();
  const tintKey = pickTint(recipeId);

  await db.insert(recipes).values({
    id: recipeId,
    userId,
    title: parsed.title,
    duration: parsed.duration,
    servings: parsed.servings,
    tag: parsed.tag,
    // AI-suggested but untrusted — normalize coerces unknown values to null.
    category: normalizeCategory(parsed.category),
    tintKey,
    sourceUrl,
    imageUrl: parsed.imageUrl,
  });

  for (let i = 0; i < parsed.ingredients.length; i++) {
    const ing = parsed.ingredients[i];
    await db.insert(ingredients).values({
      id: `${recipeId}_ing_${i}`,
      recipeId,
      amount: ing.amount,
      name: ing.name,
      prep: ing.prep,
      orderIndex: i,
    });
  }

  for (let i = 0; i < parsed.steps.length; i++) {
    const step = parsed.steps[i];
    await db.insert(steps).values({
      id: `${recipeId}_step_${i}`,
      recipeId,
      orderIndex: i,
      segmentsJson: JSON.stringify(step.segments),
      ingredientsJson: JSON.stringify(step.ingredients),
      timersJson: JSON.stringify(step.timers),
    });
  }

  for (let i = 0; i < parsed.prepItems.length; i++) {
    const item = parsed.prepItems[i];
    await db.insert(prepItems).values({
      id: `${recipeId}_prep_${i}`,
      recipeId,
      label: item.label,
      duration: item.duration,
      defaultChecked: item.defaultChecked,
      orderIndex: i,
    });
  }

  for (let i = 0; i < parsed.tools.length; i++) {
    const tool = parsed.tools[i];
    await db.insert(tools).values({
      id: `${recipeId}_tool_${i}`,
      recipeId,
      name: tool.name,
      price: tool.price,
      partner: tool.partner,
      orderIndex: i,
    });
  }

  return recipeId;
}

function pickTint(seed: string): 'terracotta' | 'olive' {
  const sum = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return sum % 2 === 0 ? 'terracotta' : 'olive';
}
