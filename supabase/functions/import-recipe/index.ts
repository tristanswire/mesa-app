import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.0';
import type { ImportRequest, ImportResponse, ParsedRecipe, VisionMediaType } from './types.ts';
import { PHOTO_MEDIA_TYPES, VISION_MEDIA_TYPES } from './types.ts';
import { parseJsonLd } from './jsonld.ts';
import type { PartialRecipe } from './jsonld.ts';
import { annotateRecipe, buildFallbackRecipe } from './annotate.ts';
import { MAX_TEXT_CHARS, parseImageWithAI, parseTextWithAI, parseWithAI } from './parse.ts';
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
    let body: unknown;
    try {
      body = (await req.json()) as ImportRequest;
    } catch {
      return jsonResponse({ success: false, error: INVALID_REQUEST });
    }

    const input = resolveMode(body);

    if (input.mode === 'invalid') {
      console.error('[import-recipe] rejected request:', input.error);
      return jsonResponse({ success: false, error: input.error });
    }

    // Photo and text share the URL path's model, validation, retry, and
    // ingredient cleanup — they differ only in prompt and input shape, and
    // neither has a source image to store.
    if (input.mode === 'photo' || input.mode === 'text') {
      const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
      console.log(`[import-recipe] ${input.mode} path`);

      const result =
        input.mode === 'photo'
          ? await parseImageWithAI(input.imageBase64, input.mediaType, anthropic)
          : await parseTextWithAI(input.text, anthropic);

      if ('error' in result) {
        return jsonResponse({ success: false, error: result.error });
      }

      return jsonResponse({ success: true, recipe: result });
    }

    const normalizedUrl = normalizeUrl(input.url);
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
        recipe.imageUrl = await storeImageBestEffort(recipe.imageUrl);
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
      result.imageUrl = await storeImageBestEffort(result.imageUrl);
    }

    return jsonResponse({ success: true, recipe: result });
  } catch (e) {
    console.error('[import-recipe] unhandled error:', e);
    return jsonResponse({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

const INVALID_REQUEST = 'Invalid import request.';
const PHOTO_TOO_LARGE = 'That photo is too large. Try a smaller one.';
/** ~5MB decoded. Base64 inflates by 4/3, so the encoded string is ~6.7MB. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type ImportMode =
  | { mode: 'url'; url: string }
  | { mode: 'photo'; imageBase64: string; mediaType: VisionMediaType }
  | { mode: 'text'; text: string }
  | { mode: 'invalid'; error: string };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/** Decoded byte length of a base64 string, without allocating the buffer. */
function base64ByteLength(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Resolve which of the three input modes a request is using. Exactly one must
 * be present — zero modes or several is a client bug, and guessing between them
 * would silently import the wrong thing.
 */
function resolveMode(body: unknown): ImportMode {
  if (!body || typeof body !== 'object') {
    return { mode: 'invalid', error: INVALID_REQUEST };
  }

  const b = body as Partial<Record<'url' | 'imageBase64' | 'mediaType' | 'text', unknown>>;
  // Presence, not validity: a present-but-malformed field still selects its
  // mode, so the caller gets that mode's specific error rather than a generic
  // "invalid request" that hides which field is wrong.
  const present = (['url', 'imageBase64', 'text'] as const).filter(
    (key) => b[key] !== undefined && b[key] !== null,
  );

  if (present.length !== 1) {
    return { mode: 'invalid', error: INVALID_REQUEST };
  }

  if (present[0] === 'url') {
    if (!isNonEmptyString(b.url)) return { mode: 'invalid', error: 'Missing or invalid URL.' };
    return { mode: 'url', url: b.url };
  }

  if (present[0] === 'text') {
    if (!isNonEmptyString(b.text)) {
      return { mode: 'invalid', error: "That doesn't look like a recipe. Check the text and try again." };
    }
    if (b.text.length > MAX_TEXT_CHARS) {
      return {
        mode: 'invalid',
        error: `That recipe is too long (limit ${MAX_TEXT_CHARS.toLocaleString()} characters). Try trimming it.`,
      };
    }
    return { mode: 'text', text: b.text };
  }

  // Photo
  if (!isNonEmptyString(b.imageBase64)) {
    return { mode: 'invalid', error: "We couldn't read that photo. Try taking it again." };
  }
  if (!isNonEmptyString(b.mediaType)) {
    return { mode: 'invalid', error: `Missing image type. Expected one of: ${VISION_MEDIA_TYPES.join(', ')}.` };
  }
  const mediaType = b.mediaType.trim().toLowerCase();
  if (!(PHOTO_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return {
      mode: 'invalid',
      error: `That image format isn't supported. Use ${VISION_MEDIA_TYPES.join(', ')}.`,
    };
  }
  // HEIC passes the allowlist above but Claude vision cannot read it, so it is
  // rejected here with a message that names the fix rather than being sent on
  // to fail opaquely at the model. iOS shoots HEIC by default — the client
  // must transcode to JPEG before upload.
  if (!(VISION_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return {
      mode: 'invalid',
      error: "That photo is in a format we can't read yet (HEIC). Save or export it as a JPEG and try again.",
    };
  }
  if (base64ByteLength(b.imageBase64) > MAX_PHOTO_BYTES) {
    return { mode: 'invalid', error: PHOTO_TOO_LARGE };
  }

  return { mode: 'photo', imageBase64: b.imageBase64, mediaType: mediaType as VisionMediaType };
}

/**
 * Best-effort image capture. `downloadAndStoreImage` already returns null on
 * every failure it anticipates, but this is the last line of defense: an
 * unexpected throw (bad env, storage client construction, a non-Error rejection)
 * must never fail an import whose recipe already parsed successfully. The image
 * is decorative; the recipe is the product. Returns null so the client falls
 * back to its placeholder.
 */
async function storeImageBestEffort(imageUrl: string): Promise<string | null> {
  try {
    return await downloadAndStoreImage(imageUrl, crypto.randomUUID());
  } catch (e) {
    console.error('[import-recipe] image step failed; returning recipe without image:', e);
    return null;
  }
}

function jsonResponse(body: ImportResponse) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
