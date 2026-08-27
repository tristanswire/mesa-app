import type { ParsedTool } from './types.ts';

/** Every tool row is attributed to this partner; the client builds the search URL. */
const DEFAULT_PARTNER = 'Amazon';

/** The client caps affiliate cards at 2-3; more than this is noise. */
const MAX_TOOLS = 3;

/**
 * Curated prices for the tools that actually recur in recipes.
 *
 * The model is asked to estimate a price and does so plausibly, but its
 * estimates drift between imports — the same cast iron skillet comes back at
 * $30 one day and $70 the next, which reads as noise on a card the user is
 * meant to trust. A fixed table for the common cases keeps the number stable;
 * anything not listed still falls back to the model.
 *
 * Prices are typical Amazon retail for a mid-range option, as a shopping
 * reference rather than a quote. Ordered most specific first — the first
 * keyword hit wins, so "cast iron skillet" must precede "skillet".
 */
type CuratedTool = { readonly keywords: readonly string[]; readonly price: string };

const CURATED_TOOL_PRICES: readonly CuratedTool[] = [
  // Appliances
  { keywords: ['stand mixer'], price: '$380' },
  { keywords: ['hand mixer', 'electric mixer'], price: '$35' },
  { keywords: ['food processor'], price: '$100' },
  { keywords: ['immersion blender', 'stick blender'], price: '$45' },
  { keywords: ['blender'], price: '$60' },
  { keywords: ['instant pot', 'pressure cooker'], price: '$100' },
  { keywords: ['slow cooker', 'crock pot', 'crockpot'], price: '$50' },
  { keywords: ['air fryer'], price: '$90' },
  { keywords: ['kitchen scale', 'food scale'], price: '$25' },

  // Pots and pans — dutch oven first, so an enameled cast iron one isn't
  // priced as a skillet.
  { keywords: ['dutch oven'], price: '$70' },
  { keywords: ['cast iron skillet', 'cast iron pan', 'cast iron'], price: '$30' },
  { keywords: ['stock pot', 'stockpot'], price: '$45' },
  { keywords: ['saucepan', 'sauce pan'], price: '$35' },
  { keywords: ['roasting pan'], price: '$45' },
  { keywords: ['skillet', 'frying pan'], price: '$30' },
  { keywords: ['wok'], price: '$40' },
  { keywords: ['griddle'], price: '$35' },

  // Bakeware
  { keywords: ['sheet pan', 'baking sheet', 'cookie sheet'], price: '$20' },
  { keywords: ['cooling rack', 'wire rack'], price: '$18' },
  { keywords: ['springform pan'], price: '$22' },
  { keywords: ['muffin tin', 'muffin pan', 'cupcake pan'], price: '$18' },
  { keywords: ['loaf pan'], price: '$15' },
  { keywords: ['cake pan'], price: '$16' },
  { keywords: ['pie dish', 'pie plate', 'pie pan'], price: '$18' },
  { keywords: ['casserole dish', 'baking dish'], price: '$30' },
  { keywords: ['parchment paper'], price: '$12' },

  // Knives and boards
  { keywords: ['chefs knife', 'chef knife'], price: '$45' },
  { keywords: ['bread knife', 'serrated knife'], price: '$25' },
  { keywords: ['paring knife'], price: '$12' },
  { keywords: ['cutting board'], price: '$25' },
  { keywords: ['kitchen shears', 'kitchen scissors'], price: '$18' },

  // Hand tools
  { keywords: ['mixing bowl'], price: '$30' },
  { keywords: ['measuring cup'], price: '$15' },
  { keywords: ['measuring spoon'], price: '$10' },
  { keywords: ['instant read thermometer', 'meat thermometer', 'thermometer'], price: '$20' },
  { keywords: ['cookie scoop', 'ice cream scoop'], price: '$14' },
  { keywords: ['box grater', 'grater'], price: '$16' },
  { keywords: ['microplane', 'zester'], price: '$15' },
  { keywords: ['fine mesh sieve', 'sieve', 'strainer'], price: '$15' },
  { keywords: ['colander'], price: '$20' },
  { keywords: ['rolling pin'], price: '$15' },
  { keywords: ['mandoline'], price: '$35' },
  { keywords: ['mortar and pestle'], price: '$30' },
  { keywords: ['dough whisk'], price: '$16' },
  { keywords: ['whisk'], price: '$12' },
  { keywords: ['spatula'], price: '$10' },
  { keywords: ['tongs'], price: '$14' },
  { keywords: ['wooden spoon'], price: '$12' },
  { keywords: ['ladle'], price: '$12' },
  { keywords: ['potato masher'], price: '$12' },
  { keywords: ['garlic press'], price: '$15' },
  { keywords: ['peeler'], price: '$10' },
  { keywords: ['pastry brush'], price: '$9' },
  { keywords: ['bench scraper'], price: '$10' },
];

/**
 * Fold the model's punctuation and casing away so "Chef's Knife", "chefs
 * knife" and "CHEF KNIFE" all reach the same keyword.
 */
function normalizeToolName(name: string): string {
  return name
    .toLowerCase()
    // Apostrophes are dropped, not spaced: "chef's" has to become "chefs",
    // not "chef s".
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The curated price for this tool name, or null when nothing matches. */
export function curatedToolPrice(name: string): string | null {
  const normalized = normalizeToolName(name);
  if (!normalized) return null;
  for (const entry of CURATED_TOOL_PRICES) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) return entry.price;
  }
  return null;
}

/**
 * Coerce untrusted model/JSON-LD tool output into the shape the client can
 * actually persist.
 *
 * This is not cosmetic: `price` and `partner` are NOT NULL columns in the
 * local SQLite `tools` table, so a null from the model fails the insert and
 * takes down the entire import with a generic "Something went wrong" — the
 * recipe parses fine and is then thrown away at save time. Normalizing here
 * keeps that failure impossible regardless of what the model returns.
 *
 * Nameless entries are dropped (a card with no product name is unusable);
 * everything else is coerced rather than rejected, because a tool with a
 * missing price is still a useful card.
 */
export function normalizeTools(value: unknown): ParsedTool[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): ParsedTool => {
      const t = (raw ?? {}) as Partial<Record<keyof ParsedTool, unknown>>;
      const name = typeof t.name === 'string' ? t.name.trim() : '';
      // Price is advisory shopping context, not a quote — an empty string
      // renders as a card without a price rather than breaking the insert.
      const estimated = typeof t.price === 'string' ? t.price.trim() : '';
      return {
        name,
        // A curated price wins over the model's estimate; an unlisted tool
        // keeps whatever the model came up with.
        price: curatedToolPrice(name) ?? estimated,
        partner:
          typeof t.partner === 'string' && t.partner.trim().length > 0
            ? t.partner.trim()
            : DEFAULT_PARTNER,
      };
    })
    .filter((t) => t.name.length > 0)
    .slice(0, MAX_TOOLS);
}

/**
 * Prefer tools the page actually declared (schema.org `tool`) over anything the
 * model suggested — real page data beats inference. Falls back to the model's
 * suggestions when the page declared none, which is the overwhelmingly common
 * case: virtually no recipe site publishes schema.org `tool`.
 */
export function mergeTools(fromPage: unknown, fromModel: unknown): ParsedTool[] {
  const page = normalizeTools(fromPage);
  return page.length > 0 ? page : normalizeTools(fromModel);
}
