import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BUCKET = 'recipe-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

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

  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MesaBot/1.0)',
      },
    });
  } catch (e) {
    console.error('[image] fetch failed:', e);
    clearTimeout(timeoutId);
    return null;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    console.error('[image] non-OK response:', response.status, sourceUrl);
    return null;
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    console.error('[image] not an image content-type:', contentType);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
    console.error('[image] too large:', arrayBuffer.byteLength);
    return null;
  }

  const ext = mimeToExt(contentType);
  const filePath = `${recipeId}.${ext}`;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    console.error('[image] upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  console.log('[image] stored:', data.publicUrl);
  return data.publicUrl;
}

function mimeToExt(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}
