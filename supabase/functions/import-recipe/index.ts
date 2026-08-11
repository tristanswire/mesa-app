import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ImportRequest, ImportResponse, ParsedRecipe } from './types.ts';
import { parseJsonLd } from './jsonld.ts';
import type { PartialRecipe } from './jsonld.ts';
import { annotateRecipe, buildFallbackRecipe } from './annotate.ts';
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

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const FETCH_TIMEOUT_MS = 15_000;

type FetchOutcome =
  | { ok: true; response: Response }
  | { ok: false; timedOut: true }
  | { ok: false; timedOut: false; status: number };

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches the page, retrying once after 1s on network error, timeout, or non-ok
 * status. Recipe sites are flaky enough that a single attempt makes the whole
 * import non-deterministic.
 */
async function fetchPage(url: string): Promise<FetchOutcome> {
  let timedOut = false;
  // status 0 means "never got a response" (network error / abort)
  let status = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const response = await fetchOnce(url);
      if (response.ok) return { ok: true, response };

      // Release the body so the failed attempt doesn't leak the connection.
      await response.body?.cancel();
      timedOut = false;
      status = response.status;
      console.log(`[import-recipe] fetch attempt ${attempt} returned HTTP ${status}`);
    } catch (e) {
      timedOut = e instanceof Error && e.name === 'AbortError';
      status = 0;
      console.error(`[import-recipe] fetch attempt ${attempt} failed:`, e);
    }
  }

  return timedOut ? { ok: false, timedOut: true } : { ok: false, timedOut: false, status };
}

function handleFetchFailure(status: number, url: string): Response {
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = '<unknown>';
  }

  console.log(`[import-recipe] fetch-blocked status=${status} domain=${domain}`);

  if (status === 0) {
    return jsonResponse({
      success: false,
      error: "Could not reach that site. Check the link and try again.",
    });
  }

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

    const outcome = await fetchPage(normalizedUrl);

    if (!outcome.ok) {
      if (outcome.timedOut) {
        return jsonResponse({
          success: false,
          error: 'This site is taking too long to respond. Try again in a moment.',
        });
      }
      return handleFetchFailure(outcome.status, normalizedUrl);
    }

    const html = await outcome.response.text();
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    // Pass 1 — JSON-LD + AI annotation.
    // Only a parseJsonLd() failure may fall through to Pass 2. Once we have a
    // valid JSON-LD recipe, an annotation failure degrades to plain steps
    // rather than throwing away a good parse for the flakier full-AI path.
    let partial: PartialRecipe | null = null;
    try {
      partial = parseJsonLd(html);
    } catch (e) {
      console.error('[import-recipe] parseJsonLd threw, falling back to full AI parse:', e);
    }

    if (partial) {
      console.log(
        `[import-recipe] JSON-LD path · ${partial.ingredients.length} ingredients · ${partial.plainSteps.length} steps`,
      );

      let recipe: ParsedRecipe;
      try {
        recipe = await annotateRecipe(partial, anthropic);
      } catch (e) {
        console.error(
          '[import-recipe] annotateRecipe threw; returning un-annotated JSON-LD recipe:',
          e,
        );
        recipe = buildFallbackRecipe(partial);
      }

      if (recipe.imageUrl) {
        const recipeFileId = crypto.randomUUID();
        recipe.imageUrl = await downloadAndStoreImage(recipe.imageUrl, recipeFileId);
      }

      return jsonResponse({ success: true, recipe });
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
