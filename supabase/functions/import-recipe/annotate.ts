import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ParsedRecipe, ParsedStep } from './types.ts';
import type { PartialRecipe } from './jsonld.ts';
import { ANNOTATE_PROMPT } from './prompts.ts';
import { extractJson } from './extractJson.ts';

type AnnotateResponse = {
  category?: string | null;
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
    imageUrl: partial.imageUrl,
    ingredients: cleanIngredients,
    steps: parsed.steps,
    prepItems: partial.prepItems,
    tools: partial.tools,
  };
}

function buildFallbackRecipe(partial: PartialRecipe): ParsedRecipe {
  const cleanIngredients = partial.ingredients.map(({ id: _id, ...rest }) => rest);

  return {
    title: partial.title,
    duration: partial.duration,
    servings: partial.servings,
    tag: partial.tag,
    category: null,
    imageUrl: partial.imageUrl,
    ingredients: cleanIngredients,
    steps: partial.plainSteps.map((s) => ({
      segments: [{ type: 'text', content: s.text }],
      ingredients: [],
      timers: [],
    })),
    prepItems: partial.prepItems,
    tools: partial.tools,
  };
}
