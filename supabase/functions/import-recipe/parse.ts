import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ParsedRecipe, VisionMediaType } from './types.ts';
import { FULL_PARSE_PROMPT, PHOTO_PARSE_PROMPT, TEXT_PARSE_PROMPT } from './prompts.ts';
import { extractJson } from './extractJson.ts';
import { stripParentheticals } from './text.ts';
import { normalizeTools } from './tools.ts';

const PARSE_FAILED = 'Could not parse the recipe from this page.';
const PHOTO_PARSE_FAILED = "We couldn't read that photo. Try a clearer shot.";
const TEXT_PARSE_FAILED = "We couldn't read that recipe. Check the text and try again.";

/** Freeform text is capped before it reaches the model. */
export const MAX_TEXT_CHARS = 20_000;

/**
 * A user message body. The URL and text paths send a single text block; the
 * photo path prepends an image block (image first reads more reliably than
 * instructions-first for vision).
 */
type MessageContent = Array<
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: VisionMediaType; data: string };
    }
>;

type Attempt =
  /** A recipe that passed shape validation. */
  | { kind: 'recipe'; recipe: ParsedRecipe }
  /** The model reported the page has no recipe — surface its message as-is. */
  | { kind: 'modelError'; error: string }
  /** No JSON could be extracted or parsed from the response. */
  | { kind: 'unparseable' }
  /** Valid JSON, but not a usable recipe — worth one retry. */
  | { kind: 'invalid' };

/**
 * One retry, but only for a response that parsed as JSON yet wasn't a usable
 * recipe — the model occasionally returns a partial object on good input.
 *
 * Shared by all three input modes so retry semantics, validation, and
 * ingredient cleanup can't drift between them.
 */
async function parseWithRetry(
  content: MessageContent,
  anthropic: Anthropic,
  label: string,
  parseFailed: string,
): Promise<ParsedRecipe | { error: string }> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await runParse(content, anthropic, label);

    if (result.kind === 'recipe') return result.recipe;
    if (result.kind === 'modelError') return { error: result.error };
    if (result.kind === 'unparseable') return { error: parseFailed };

    console.error(`[import-recipe] ${label}: attempt ${attempt} failed validation`);
  }

  return { error: parseFailed };
}

export async function parseWithAI(
  html: string,
  anthropic: Anthropic,
): Promise<ParsedRecipe | { error: string }> {
  const cleaned = stripNoise(html);
  const truncated = cleaned.slice(0, 80000);

  return parseWithRetry(
    [{ type: 'text', text: `${FULL_PARSE_PROMPT}\n\nHTML:\n${truncated}` }],
    anthropic,
    'full-parse',
    PARSE_FAILED,
  );
}

/**
 * Photo import. The user's photo is used for parsing only — it is never
 * uploaded to storage, so the returned recipe always has imageUrl: null.
 */
export async function parseImageWithAI(
  imageBase64: string,
  mediaType: VisionMediaType,
  anthropic: Anthropic,
): Promise<ParsedRecipe | { error: string }> {
  const result = await parseWithRetry(
    [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
      { type: 'text', text: PHOTO_PARSE_PROMPT },
    ],
    anthropic,
    'photo-parse',
    PHOTO_PARSE_FAILED,
  );

  return 'error' in result ? result : { ...result, imageUrl: null };
}

/** Manual/freeform text import. No source image, so imageUrl is always null. */
export async function parseTextWithAI(
  text: string,
  anthropic: Anthropic,
): Promise<ParsedRecipe | { error: string }> {
  const truncated = text.slice(0, MAX_TEXT_CHARS);

  const result = await parseWithRetry(
    [{ type: 'text', text: `${TEXT_PARSE_PROMPT}\n\nRECIPE TEXT:\n${truncated}` }],
    anthropic,
    'text-parse',
    TEXT_PARSE_FAILED,
  );

  return 'error' in result ? result : { ...result, imageUrl: null };
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

async function runParse(
  content: MessageContent,
  anthropic: Anthropic,
  label: string,
): Promise<Attempt> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    temperature: 0,
    messages: [{ role: 'user', content }],
  });

  const inputTokens = message.usage?.input_tokens ?? 0;
  const outputTokens = message.usage?.output_tokens ?? 0;
  const inputCost = (inputTokens / 1_000_000) * 1.0;
  const outputCost = (outputTokens / 1_000_000) * 5.0;
  const totalCost = inputCost + outputCost;
  console.log(
    `[import-recipe] ${label} tokens: ${inputTokens} in / ${outputTokens} out · ` +
      `cost: $${totalCost.toFixed(4)}`,
  );

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const extracted = extractJson(text);
  if (!extracted) {
    console.error(`[import-recipe] ${label}: could not extract JSON. Raw:`, text.slice(0, 2000));
    return { kind: 'unparseable' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    console.error(`[import-recipe] ${label}: JSON.parse failed.`, e);
    return { kind: 'unparseable' };
  }

  const asError = parsed as { error?: unknown } | null;
  if (asError && typeof asError.error === 'string') {
    return { kind: 'modelError', error: asError.error };
  }

  if (!isValidRecipe(parsed)) {
    return { kind: 'invalid' };
  }

  const cleaned = stripIngredientParentheticals(parsed);
  // Model output is untrusted: a null price/partner would fail the client's
  // NOT NULL tools insert and sink an otherwise-good import.
  return { kind: 'recipe', recipe: { ...cleaned, tools: normalizeTools(cleaned.tools) } };
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
