// Pure half of recipe search: how a query becomes a SQL pattern, and how hits
// from several fields collapse into one ranked list. The SQL itself lives in
// data/recipes.ts — keeping the decisions here means they can be tested without
// a database.

/**
 * Where a term matched. Lower wins: ranking is by field rather than by
 * relevance within a field, so a recipe whose *title* says "chicken" always
 * sorts above one that merely lists chicken among its ingredients.
 */
export const SEARCH_RANK = { title: 1, tag: 2, ingredient: 3, note: 4 } as const;

export type SearchRank = (typeof SEARCH_RANK)[keyof typeof SEARCH_RANK];

/** The escape character paired with every LIKE in the search queries. */
export const LIKE_ESCAPE = '\\';

/**
 * A case-insensitive substring pattern for SQL LIKE.
 *
 * `%` and `_` are LIKE wildcards, and a backslash is our escape character — a
 * user typing any of them means the literal character, so each is escaped and
 * the query pairs this with `ESCAPE '\'`. Without that, searching "50%" would
 * match every recipe in the library.
 *
 * Returns null for a blank query, which callers read as "no search applied".
 */
export function buildLikePattern(query: string): string | null {
  const term = query.trim().toLowerCase();
  if (!term) return null;
  const escaped = term.replace(/[\\%_]/g, (char) => `${LIKE_ESCAPE}${char}`);
  return `%${escaped}%`;
}

/** One field's hits: the ids that matched, and the rank that field carries. */
export type RankedGroup = { ids: readonly string[]; rank: SearchRank };

/**
 * Collapse per-field hits into one id → rank map, keeping the best (lowest)
 * rank for a recipe that matched in more than one field. A recipe called
 * "Chicken Piccata" that also lists chicken ranks as a title hit, not twice.
 */
export function rankMatches(groups: readonly RankedGroup[]): Map<string, SearchRank> {
  const ranked = new Map<string, SearchRank>();
  for (const group of groups) {
    for (const id of group.ids) {
      const existing = ranked.get(id);
      if (existing === undefined || group.rank < existing) ranked.set(id, group.rank);
    }
  }
  return ranked;
}
