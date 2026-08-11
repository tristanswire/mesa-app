/**
 * Parentheticals that carry cooking instructions rather than restating the
 * measurement. Matched on the trimmed, lowercased inner text — exact phrase
 * only, so "(optional, but good)" is still noise and gets cut.
 */
const KEEP_PARENTHETICALS = new Set(['optional', 'divided', 'to taste']);

/**
 * Removes parenthetical segments from a string, including nested and doubled
 * parens, except for the semantic few listed in KEEP_PARENTHETICALS.
 *
 *   "1/4 cup all-purpose flour ((30 grams))" → "1/4 cup all-purpose flour"
 *   "sugar (200g) sifted"                    → "sugar sifted"
 *   "2 cups sugar (200g), sifted"            → "2 cups sugar, sifted"
 *   "1 tsp salt (optional)"                  → "1 tsp salt (optional)"
 *   "1 cup flour (120g) (divided)"           → "1 cup flour (divided)"
 *
 * Depth-counted rather than regex-based: a single regex can't handle nesting,
 * and the recursive-replace alternative loops on unbalanced input. Unbalanced
 * parens are treated as an unterminated segment — "flour (30 grams" drops the
 * remainder, a stray ")" is dropped on its own — which is the right call for
 * scraped text where the opener is what signals "this is an aside". An
 * unterminated "(to taste" is dropped for the same reason: the allowlist check
 * only fires on a segment we actually saw close.
 *
 * A kept segment is re-emitted exactly as written, casing and inner spacing
 * intact — the allowlist decides whether to keep, never how to rewrite.
 *
 * Strings with no parens are returned byte-for-byte unchanged; the whitespace
 * cleanup only runs on strings that had a paren, so this can't quietly reformat
 * well-formed ingredient text.
 */
export function stripParentheticals(text: string): string {
  if (!text.includes('(') && !text.includes(')')) return text;

  let out = '';
  let depth = 0;
  // Inner text of the top-level parenthetical currently open, nested parens
  // included, so the whole thing can be re-emitted verbatim if it's kept.
  let segment = '';

  for (const ch of text) {
    if (ch === '(') {
      depth++;
      if (depth > 1) segment += ch;
      continue;
    }

    if (ch === ')') {
      if (depth === 0) continue; // stray closer
      depth--;
      if (depth > 0) {
        segment += ch;
        continue;
      }
      if (KEEP_PARENTHETICALS.has(segment.trim().toLowerCase())) {
        out += `(${segment})`;
      }
      segment = '';
      continue;
    }

    if (depth === 0) out += ch;
    else segment += ch;
  }

  return out
    // Collapse the gap left behind ("sugar  sifted" → "sugar sifted").
    .replace(/\s+/g, ' ')
    // Cutting mid-clause can strand a space before punctuation
    // ("sugar (200g), sifted" → "sugar , sifted").
    .replace(/\s+([,;.])/g, '$1')
    .trim();
}
