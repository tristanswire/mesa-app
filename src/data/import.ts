import * as Crypto from 'expo-crypto';
import { FunctionsFetchError } from '@supabase/supabase-js';
import { db } from '../db/client';
import { ingredients, prepItems, recipes, recipeTags, steps, tools } from '../db/schema';
import { supabase } from '../supabase/client';
import type { ImportResponse, ParsedRecipe } from '../supabase/sharedTypes';
import { normalizeCategory } from './recipes';
import { getCurrentUserId } from './user';

export type ImportResult =
  | { success: true; recipeId: string }
  | { success: false; error: string };

/**
 * The three input modes the Edge Function accepts. Exactly one per request —
 * the server rejects zero or multiple modes rather than guessing.
 */
type ImportPayload =
  | { url: string }
  | { imageBase64: string; mediaType: 'image/jpeg' }
  | { text: string };

/** Freeform text cap, mirroring the Edge Function's own limit. */
export const MAX_MANUAL_TEXT_CHARS = 20_000;

/**
 * Single invoke + response path shared by all three modes. Only the request
 * body and the stored `sourceUrl` differ; parsing, error mapping, and the local
 * DB write are identical, so a fix in one mode is a fix in all three.
 *
 * `sourceUrl` is null for photo and manual imports — there is no originating
 * page. Those recipes also come back with `imageUrl: null`, which the recipe
 * card and detail views already render via the existing tinted placeholder.
 */
async function runImport(payload: ImportPayload, sourceUrl: string | null): Promise<ImportResult> {
  try {
    const { data, error } = await supabase.functions.invoke<ImportResponse>('import-recipe', {
      body: payload,
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
        error: 'Could not reach the recipe import service. Please try again.',
      };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error ?? 'Could not parse the recipe.' };
    }

    const recipeId = await saveRecipeToLocalDB(data.recipe, sourceUrl);
    return { success: true, recipeId };
  } catch (e) {
    console.error('[import] unexpected error', e);
    return { success: false, error: 'Something went wrong.' };
  }
}

export function importRecipeFromUrl(url: string): Promise<ImportResult> {
  return runImport({ url }, url);
}

/**
 * Photo import. `imageBase64` must already be a downscaled JPEG — see
 * `processRecipePhoto` in src/lib/photoImport.ts. The server rejects HEIC, so
 * transcoding is the client's job and is not optional on iOS.
 */
export function importRecipeFromPhoto(imageBase64: string): Promise<ImportResult> {
  return runImport({ imageBase64, mediaType: 'image/jpeg' }, null);
}

/** Manual / pasted-text import. */
export function importRecipeFromText(text: string): Promise<ImportResult> {
  return runImport({ text }, null);
}

async function saveRecipeToLocalDB(
  parsed: ParsedRecipe,
  sourceUrl: string | null,
): Promise<string> {
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

  // Tags arrive normalized from the server (lowercase, deduped, meal type
  // excluded). A recipe imported before tags existed simply has no rows here.
  const parsedTags = Array.isArray(parsed.tags) ? parsed.tags : [];
  for (let i = 0; i < parsedTags.length; i++) {
    await db.insert(recipeTags).values({
      id: `${recipeId}_tag_${i}`,
      recipeId,
      tag: parsedTags[i],
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
