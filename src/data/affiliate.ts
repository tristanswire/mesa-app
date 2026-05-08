// PLACEHOLDER tags — Phase 3.11 swaps in real associate IDs once enrolled.
const AMAZON_ASSOCIATE_TAG = 'cookwithmesa-20';
const SUR_LA_TABLE_TAG = 'mesa-affiliate';

/**
 * Take a base URL + partner name, return the URL with that partner's tracking
 * params attached. Returns the URL unmodified if the partner isn't recognized.
 */
export function buildAffiliateUrl(baseUrl: string, partner: string): string {
  if (!baseUrl) return '';
  const partnerLower = partner.toLowerCase();

  if (partnerLower === 'amazon') {
    return appendQueryParam(baseUrl, 'tag', AMAZON_ASSOCIATE_TAG);
  }
  if (partnerLower === 'sur la table' || partnerLower === 'sur-la-table') {
    return appendQueryParam(baseUrl, 'aff_id', SUR_LA_TABLE_TAG);
  }

  return baseUrl;
}

/**
 * No specific affiliate URL? Build a partner search URL for the tool name.
 * Better than a dead tap — sends users to the partner's results page.
 */
export function buildPartnerSearchUrl(toolName: string, partner: string): string {
  const partnerLower = partner.toLowerCase();
  const encoded = encodeURIComponent(toolName);

  if (partnerLower === 'amazon') {
    return `https://www.amazon.com/s?k=${encoded}`;
  }
  if (partnerLower === 'sur la table' || partnerLower === 'sur-la-table') {
    return `https://www.surlatable.com/search?query=${encoded}`;
  }
  if (partnerLower === 'williams sonoma' || partnerLower === 'williams-sonoma') {
    return `https://www.williams-sonoma.com/search/results.html?words=${encoded}`;
  }

  return `https://www.google.com/search?q=${encoded}`;
}

function appendQueryParam(url: string, key: string, value: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    return url;
  }
}
