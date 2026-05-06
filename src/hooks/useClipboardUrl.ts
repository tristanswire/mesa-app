import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';

// Permissive: matches http(s)://... or bare domain (example.com/...).
// The Edge Function validates further and normalizes missing protocols.
const URL_PATTERN = /^(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/;

function extractUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.length > 2000) return null;

  const match = trimmed.match(URL_PATTERN);
  return match ? match[0] : null;
}

/**
 * Read the iOS clipboard once on mount. Returns the detected URL or null.
 * Only call from screens where the user has explicitly indicated import intent
 * (e.g., the Import modal) — the read triggers iOS's "Pasted from..." toast.
 */
export function useClipboardUrl() {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const read = useCallback(async () => {
    try {
      const hasContent = await Clipboard.hasStringAsync();
      if (!hasContent) {
        setUrl(null);
        return;
      }
      const text = await Clipboard.getStringAsync();
      setUrl(extractUrl(text));
    } catch (e) {
      console.error('[useClipboardUrl] read failed:', e);
      setUrl(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // iOS 14+ shows a "Pasted from..." toast on every clipboard read.
    // We read only when this hook mounts (i.e., Import modal opens), so the
    // toast aligns with explicit user intent. No way to suppress it; this is
    // an Apple privacy feature, not a permission we can request.
    read();
  }, [read]);

  return { url, loaded, refresh: read };
}
