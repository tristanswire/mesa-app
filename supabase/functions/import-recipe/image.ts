import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'recipe-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
// The fetch AbortController covers the download only. The Storage upload is a
// separate network call with no timeout of its own, so a hung upload would
// stall the whole import behind an image that is merely decorative.
const UPLOAD_TIMEOUT_MS = 10_000;

/** Reject after `ms` so a hung promise can't hold the function open. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Download an image from sourceUrl, upload it to Supabase Storage, return the public URL.
 * Returns null on any failure — caller falls back to placeholder.
 */
export async function downloadAndStoreImage(
  sourceUrl: string,
  recipeId: string,
): Promise<string | null> {
  if (!sourceUrl) return null;

  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    console.error('[image] invalid source URL:', sourceUrl);
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let contentType: string;
  let arrayBuffer: ArrayBuffer;
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MesaBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error('[image] non-OK response:', response.status, sourceUrl);
      return null;
    }

    contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      console.error('[image] not an image content-type:', contentType);
      return null;
    }

    // Read the body inside the same abort window: a stalled response stream is
    // just as capable of hanging the import as a stalled connect, and the old
    // code cleared the timeout before this line ever ran.
    arrayBuffer = await response.arrayBuffer();
  } catch (e) {
    console.error('[image] download failed:', e);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }

  if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
    console.error('[image] too large:', arrayBuffer.byteLength);
    return null;
  }

  const ext = mimeToExt(contentType);
  const filePath = `${recipeId}.${ext}`;

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error } = await withTimeout(
      supabase.storage.from(BUCKET).upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      }),
      UPLOAD_TIMEOUT_MS,
      '[image] storage upload',
    );

    if (error) {
      console.error('[image] upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    console.log('[image] stored:', data.publicUrl);
    return data.publicUrl;
  } catch (e) {
    console.error('[image] upload failed:', e);
    return null;
  }
}

function mimeToExt(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}
