import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ImportRequest, ImportResponse, ParsedRecipe } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PARSE_PROMPT = `RESPONSE FORMAT: Output ONLY a single JSON object. No prose, no fences, no explanation. Start with { and end with }.

Extract a structured recipe from HTML.

JSON shape:
{
  "title": "string",
  "duration": "30 min" or "1 hr 20 min",
  "servings": number,
  "tag": "Weeknight" | "Quick" | "Dessert" | "Side" | "Breakfast" | "Slow-cooker" | "Vegetarian" | null,
  "ingredients": [{ "amount": "2 tbsp", "name": "olive oil", "prep": "minced" or null }],
  "steps": [{ "segments": [...], "ingredients": [...], "timers": [...] }],
  "prepItems": [{ "label": "Preheat oven to 425°F", "duration": "20 min" or null, "defaultChecked": false }],
  "tools": [{ "name": "Cast Iron Skillet", "price": "$45", "partner": "Amazon" }]
}

Step segments concatenate to the full instruction:
- {"type":"text","content":"Heat "}
- {"type":"ingredient","ingredientId":"ing-1"} (reference an item in this step's ingredients array)
- {"type":"text","content":" in a skillet, then bake "}
- {"type":"timer","timerId":"timer-1"} (reference an item in this step's timers array)
- {"type":"text","content":" until fragrant."}

Each step's "ingredients" array: [{"id":"ing-1","display":"2 tbsp olive oil"}]
Each step's "timers" array: [{"id":"timer-1","label":"bake 18 min","durationSeconds":1080}]

CONSTRAINTS:
- Maximum 4 prep items
- Maximum 3 tools
- Tag must be from the enum above; null if no clean fit
- Each step's text segments should be concise — extract the action, omit narrative

If the page has no recipe content (login wall, video-only, no actual recipe), return: {"error":"Could not extract a recipe from this page."}

Output ONLY the JSON object. The first character must be {.`;

function extractJson(text: string): string | null {
  const trimmed = text.trim();

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // fall through
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    try {
      JSON.parse(inner);
      return inner;
    } catch {
      // continue
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  return null;
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }

  const withProtocol = `https://${trimmed}`;
  try {
    new URL(withProtocol);
    return withProtocol;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = (await req.json()) as ImportRequest;

    if (!url || typeof url !== 'string') {
      return json({ success: false, error: 'Missing or invalid URL.' });
    }

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return json({ success: false, error: "That doesn't look like a valid URL." });
    }

    const pageResponse = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MesaBot/1.0; +https://mesa.app/bot)',
      },
    });

    if (!pageResponse.ok) {
      return json({ success: false, error: `Could not fetch the page (HTTP ${pageResponse.status}).` });
    }

    const html = await pageResponse.text();
    const truncated = html.slice(0, 50000);

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `${PARSE_PROMPT}\n\nHTML:\n${truncated}`,
        },
      ],
    });

    const inputTokens = message.usage?.input_tokens ?? 0;
    const outputTokens = message.usage?.output_tokens ?? 0;
    const inputCost = (inputTokens / 1_000_000) * 1.0;
    const outputCost = (outputTokens / 1_000_000) * 5.0;
    const totalCost = inputCost + outputCost;
    console.log(
      `[import-recipe] tokens: ${inputTokens} in / ${outputTokens} out · ` +
      `cost: $${totalCost.toFixed(4)} (in: $${inputCost.toFixed(4)}, out: $${outputCost.toFixed(4)})`
    );

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    const extracted = extractJson(text);
    if (!extracted) {
      console.error('[import-recipe] Could not extract JSON from Claude response. Raw response:', text.slice(0, 2000));
      return json({ success: false, error: 'Could not parse the recipe from this page.' });
    }

    let parsed: ParsedRecipe | { error: string };
    try {
      parsed = JSON.parse(extracted);
    } catch (e) {
      console.error('[import-recipe] JSON.parse failed after extraction. Extracted:', extracted.slice(0, 2000), 'Error:', e);
      return json({ success: false, error: 'Could not parse the recipe from this page.' });
    }

    if ('error' in parsed) {
      return json({ success: false, error: parsed.error });
    }

    return json({ success: true, recipe: parsed });
  } catch (e) {
    console.error('[import-recipe] error', e);
    return json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

function json(body: ImportResponse) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
