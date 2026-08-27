import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ParsedRecipe, ParsedStep, ParsedTool } from './types.ts';
import type { PartialRecipe } from './jsonld.ts';
import { ANNOTATE_PROMPT } from './prompts.ts';
import { extractJson } from './extractJson.ts';
import { normalizeTags } from './tags.ts';
import { mergeTools, normalizeTools } from './tools.ts';

type AnnotateResponse = {
  category?: string | null;
  /** Model-suggested cuisine and attribute tags; normalized before storing. */
  tags?: unknown;
  /** Model-suggested equipment. Source pages almost never declare their own. */
  tools?: ParsedTool[];
  steps: ParsedStep[];
};

export async function annotateRecipe(
  partial: PartialRecipe,
  anthropic: Anthropic,
): Promise<ParsedRecipe> {
  const annotationInput = {
    title: partial.title,
    ingredients: partial.ingredients.map((ing) => ({
      id: ing.id,
      amount: ing.amount,
      name: ing.name,
      prep: ing.prep,
    })),
    steps: partial.plainSteps,
  };

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: `${ANNOTATE_PROMPT}\n\nINPUT:\n${JSON.stringify(annotationInput)}`,
      },
    ],
  });

  const inputTokens = message.usage?.input_tokens ?? 0;
  const outputTokens = message.usage?.output_tokens ?? 0;
  const inputCost = (inputTokens / 1_000_000) * 1.0;
  const outputCost = (outputTokens / 1_000_000) * 5.0;
  const totalCost = inputCost + outputCost;
  console.log(
    `[import-recipe] annotate tokens: ${inputTokens} in / ${outputTokens} out · ` +
      `cost: $${totalCost.toFixed(4)}`,
  );

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const extracted = extractJson(text);
  if (!extracted) {
    console.error('[import-recipe] annotate: could not extract JSON. Raw:', text.slice(0, 2000));
    return buildFallbackRecipe(partial);
  }

  let parsed: AnnotateResponse;
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    console.error('[import-recipe] annotate: JSON.parse failed.', e);
    return buildFallbackRecipe(partial);
  }

  if (
    !parsed.steps ||
    !Array.isArray(parsed.steps) ||
    parsed.steps.length !== partial.plainSteps.length
  ) {
    console.error(
      '[import-recipe] annotate: step count mismatch. Expected',
      partial.plainSteps.length,
      'got',
      parsed.steps?.length,
    );
    return buildFallbackRecipe(partial);
  }

  const cleanIngredients = partial.ingredients.map(({ id: _id, ...rest }) => rest);

  return {
    title: partial.title,
    duration: partial.duration,
    servings: partial.servings,
    tag: partial.tag,
    // Untrusted: model may return a value outside the allowed list, or omit
    // the field. Client validates via normalizeCategory before persisting.
    category: typeof parsed.category === 'string' ? parsed.category : null,
    tags: normalizeTags(parsed.tags, partial.duration),
    imageUrl: partial.imageUrl,
    ingredients: cleanIngredients,
    steps: parsed.steps,
    prepItems: partial.prepItems,
    // schema.org `tool` is published by almost no recipe site, so partial.tools
    // is nearly always empty and the model's suggestions are what the user
    // actually sees. Page data still wins when it exists.
    tools: mergeTools(partial.tools, parsed.tools),
  };
}

export function buildFallbackRecipe(partial: PartialRecipe): ParsedRecipe {
  const cleanIngredients = partial.ingredients.map(({ id: _id, ...rest }) => rest);

  return {
    title: partial.title,
    duration: partial.duration,
    servings: partial.servings,
    tag: partial.tag,
    category: null,
    // Annotation failed, so there are no model tags — the time bucket is
    // computed from the duration regardless, so even this path is tagged.
    tags: normalizeTags(undefined, partial.duration),
    imageUrl: partial.imageUrl,
    ingredients: cleanIngredients,
    steps: partial.plainSteps.map((s) => ({
      segments: [{ type: 'text', content: s.text }],
      ingredients: [],
      timers: [],
    })),
    prepItems: partial.prepItems,
    // Degraded path — annotation failed, so there are no model-suggested tools
    // to fall back on. Only page-declared tools survive here.
    tools: normalizeTools(partial.tools),
  };
}
