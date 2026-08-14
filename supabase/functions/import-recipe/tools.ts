import type { ParsedTool } from './types.ts';

/** Every tool row is attributed to this partner; the client builds the search URL. */
const DEFAULT_PARTNER = 'Amazon';

/** The client caps affiliate cards at 2-3; more than this is noise. */
const MAX_TOOLS = 3;

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
      return {
        name: typeof t.name === 'string' ? t.name.trim() : '',
        // Price is advisory shopping context, not a quote — an empty string
        // renders as a card without a price rather than breaking the insert.
        price: typeof t.price === 'string' ? t.price.trim() : '',
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
