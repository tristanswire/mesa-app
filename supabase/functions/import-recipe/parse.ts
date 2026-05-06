import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ParsedRecipe } from './types.ts';
import { FULL_PARSE_PROMPT } from './prompts.ts';
import { extractJson } from './extractJson.ts';

export async function parseWithAI(
  html: string,
  anthropic: Anthropic,
): Promise<ParsedRecipe | { error: string }> {
  const cleaned = stripNoise(html);
  const truncated = cleaned.slice(0, 80000);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
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
    return { error: 'Could not parse the recipe from this page.' };
  }

  let parsed: ParsedRecipe | { error: string };
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    console.error('[import-recipe] full-parse: JSON.parse failed.', e);
    return { error: 'Could not parse the recipe from this page.' };
  }

  return parsed;
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
