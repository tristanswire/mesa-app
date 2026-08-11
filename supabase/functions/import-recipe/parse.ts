import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ParsedRecipe } from './types.ts';
import { FULL_PARSE_PROMPT } from './prompts.ts';
import { extractJson } from './extractJson.ts';
import { stripParentheticals } from './text.ts';

const PARSE_FAILED = 'Could not parse the recipe from this page.';

type Attempt =
  /** A recipe that passed shape validation. */
  | { kind: 'recipe'; recipe: ParsedRecipe }
  /** The model reported the page has no recipe — surface its message as-is. */
  | { kind: 'modelError'; error: string }
  /** No JSON could be extracted or parsed from the response. */
  | { kind: 'unparseable' }
  /** Valid JSON, but not a usable recipe — worth one retry. */
  | { kind: 'invalid' };

export async function parseWithAI(
  html: string,
  anthropic: Anthropic,
): Promise<ParsedRecipe | { error: string }> {
  const cleaned = stripNoise(html);
  const truncated = cleaned.slice(0, 80000);

  // One retry, but only for a response that parsed as JSON yet wasn't a usable
  // recipe — the model occasionally returns a partial object on a good page.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await runParse(truncated, anthropic);

    if (result.kind === 'recipe') return result.recipe;
    if (result.kind === 'modelError') return { error: result.error };
    if (result.kind === 'unparseable') return { error: PARSE_FAILED };

    console.error(`[import-recipe] full-parse: attempt ${attempt} failed validation`);
  }

  return { error: PARSE_FAILED };
}

function isValidRecipe(parsed: unknown): parsed is ParsedRecipe {
  const r = parsed as Partial<ParsedRecipe> | null;
  return (
    !!r &&
    typeof r.title === 'string' &&
    r.title.trim().length > 0 &&
    Array.isArray(r.ingredients) &&
    r.ingredients.length >= 1 &&
    Array.isArray(r.steps) &&
    r.steps.length >= 1
  );
}

async function runParse(truncated: string, anthropic: Anthropic): Promise<Attempt> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: `${FULL_PARSE_PROMPT}\n\nHTML:\n${truncated}`,
      },
    ],
  });

  const inputTokens = message.usage?.input_tokens ?? 0;
  const outputTokens = message.usage?.output_tokens ?? 0;
  const inputCost = (inputTokens / 1_000_000) * 1.0;
  const outputCost = (outputTokens / 1_000_000) * 5.0;
  const totalCost = inputCost + outputCost;
  console.log(
    `[import-recipe] full-parse tokens: ${inputTokens} in / ${outputTokens} out · ` +
      `cost: $${totalCost.toFixed(4)}`,
  );

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const extracted = extractJson(text);
  if (!extracted) {
    console.error('[import-recipe] full-parse: could not extract JSON. Raw:', text.slice(0, 2000));
    return { kind: 'unparseable' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    console.error('[import-recipe] full-parse: JSON.parse failed.', e);
    return { kind: 'unparseable' };
  }

  const asError = parsed as { error?: unknown } | null;
  if (asError && typeof asError.error === 'string') {
    return { kind: 'modelError', error: asError.error };
  }

  if (!isValidRecipe(parsed)) {
    return { kind: 'invalid' };
  }

  return { kind: 'recipe', recipe: stripIngredientParentheticals(parsed) };
}

/**
 * Mirrors the JSON-LD path's ingredient cleanup for the full-AI path: the model
 * copies source text verbatim, parenthetical metric conversions included.
 *
 * Runs after validation so it only ever sees a well-shaped recipe. Ingredients
 * are rewritten in place, never dropped — step segments address them by index
 * and id, so removing one would break those references. A field that strips
 * down to nothing keeps its original text for the same reason.
 *
 * Step *segments* are deliberately untouched — instructions can carry
 * legitimate parentheticals ("cook until golden (about 5 minutes)"). Only the
 * per-step ingredient chips, which restate an ingredient, are cleaned so they
 * match the ingredient list they mirror.
 */
function stripIngredientParentheticals(recipe: ParsedRecipe): ParsedRecipe {
  // Model output is untrusted and only shape-validated at the top level, so a
  // field can arrive missing or non-string — pass those through untouched.
  const strip = (value: string): string =>
    typeof value === 'string' ? stripParentheticals(value) : value;
  // For fields the UI can't render empty, fall back to the original text.
  const clean = (value: string): string => strip(value) || value;

  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      amount: strip(ing.amount),
      name: clean(ing.name),
      prep: ing.prep === null ? null : strip(ing.prep) || null,
    })),
    steps: recipe.steps.map((step) => ({
      ...step,
      ingredients: Array.isArray(step.ingredients)
        ? step.ingredients.map((ref) => ({ ...ref, display: clean(ref.display) }))
        : step.ingredients,
    })),
  };
}

/**
 * Preserves <script type="application/ld+json"> in case the AI wants to use it.
 */
function stripNoise(html: string): string {
  return html
    .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}
