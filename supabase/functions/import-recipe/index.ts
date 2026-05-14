import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ImportRequest, ImportResponse } from './types.ts';
import { parseJsonLd } from './jsonld.ts';
import { annotateRecipe } from './annotate.ts';
import { parseWithAI } from './parse.ts';
import { downloadAndStoreImage } from './image.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function handleFetchFailure(status: number, url: string): Response {
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = '<unknown>';
  }

  console.log(`[import-recipe] fetch-blocked status=${status} domain=${domain}`);

  if (status === 403 || status === 401) {
    return jsonResponse({
      success: false,
      error:
        "This site doesn't allow recipe imports right now. Try saving the recipe by pasting the text into the manual entry option.",
    });
  }

  if (status === 404) {
    return jsonResponse({
      success: false,
      error: "That page doesn't exist. Check the link and try again.",
    });
  }

  if (status === 429) {
    return jsonResponse({
      success: false,
      error: 'This site is temporarily rate-limited. Try again in a few minutes.',
    });
  }

  if (status >= 500) {
    return jsonResponse({
      success: false,
      error: 'The recipe site is having trouble right now. Try again in a few minutes.',
    });
  }

  return jsonResponse({
    success: false,
    error: `Could not fetch the page (HTTP ${status}). The site may be temporarily unavailable.`,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = (await req.json()) as ImportRequest;

    if (!url || typeof url !== 'string') {
      return jsonResponse({ success: false, error: 'Missing or invalid URL.' });
    }

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      return jsonResponse({ success: false, error: "That doesn't look like a valid URL." });
    }

    const pageResponse = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MesaBot/1.0; +https://cookwithmesa.com/bot)',
      },
    });

    if (!pageResponse.ok) {
      return handleFetchFailure(pageResponse.status, normalizedUrl);
    }

    const html = await pageResponse.text();
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    // Pass 1 — JSON-LD + AI annotation
    try {
      const partial = parseJsonLd(html);
      if (partial) {
        console.log(
          `[import-recipe] JSON-LD path · ${partial.ingredients.length} ingredients · ${partial.plainSteps.length} steps`,
        );
        const annotated = await annotateRecipe(partial, anthropic);

        if (annotated.imageUrl) {
          const recipeFileId = crypto.randomUUID();
          annotated.imageUrl = await downloadAndStoreImage(annotated.imageUrl, recipeFileId);
        }

        return jsonResponse({ success: true, recipe: annotated });
      }
    } catch (e) {
      console.error('[import-recipe] JSON-LD path threw, falling back to full AI parse:', e);
    }

    // Pass 2 — AI full parse
    console.log('[import-recipe] full-AI path');
    const result = await parseWithAI(html, anthropic);

    if ('error' in result) {
      return jsonResponse({ success: false, error: result.error });
    }

    if (result.imageUrl) {
      const recipeFileId = crypto.randomUUID();
      result.imageUrl = await downloadAndStoreImage(result.imageUrl, recipeFileId);
    }

    return jsonResponse({ success: true, recipe: result });
  } catch (e) {
    console.error('[import-recipe] unhandled error:', e);
    return jsonResponse({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

function jsonResponse(body: ImportResponse) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
