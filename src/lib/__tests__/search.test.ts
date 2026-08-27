import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { buildLikePattern, rankMatches, SEARCH_RANK } from '../search.ts';

// The pure half of recipe search. The SQL lives in data/recipes.ts; what is
// pinned here is how a typed query becomes a pattern and how hits across four
// fields collapse into one ranked list.

// ── Pattern building ────────────────────────────────────────────────────────

Deno.test('a query becomes a lowercase substring pattern', () => {
  assertEquals(buildLikePattern('Chicken'), '%chicken%');
  assertEquals(buildLikePattern('  chick  '), '%chick%');
});

Deno.test('a blank query yields null, meaning no search applied', () => {
  assertEquals(buildLikePattern(''), null);
  assertEquals(buildLikePattern('   '), null);
});

// Without escaping, "50%" would match every recipe in the library.
Deno.test('LIKE wildcards typed by the user are escaped', () => {
  assertEquals(buildLikePattern('50%'), '%50\\%%');
  assertEquals(buildLikePattern('a_b'), '%a\\_b%');
  assertEquals(buildLikePattern('back\\slash'), '%back\\\\slash%');
});

// ── Rank merging ────────────────────────────────────────────────────────────

Deno.test('each field contributes its own rank', () => {
  const ranked = rankMatches([
    { ids: ['a'], rank: SEARCH_RANK.title },
    { ids: ['b'], rank: SEARCH_RANK.tag },
    { ids: ['c'], rank: SEARCH_RANK.ingredient },
    { ids: ['d'], rank: SEARCH_RANK.note },
  ]);
  assertEquals([...ranked.entries()], [['a', 1], ['b', 2], ['c', 3], ['d', 4]]);
});

Deno.test('a recipe matching several fields keeps its best rank', () => {
  const ranked = rankMatches([
    { ids: ['chicken-piccata'], rank: SEARCH_RANK.title },
    { ids: ['chicken-piccata'], rank: SEARCH_RANK.ingredient },
  ]);
  assertEquals(ranked.get('chicken-piccata'), SEARCH_RANK.title);
});

// Group order must not decide the outcome — only the rank value.
Deno.test('a better rank arriving later still wins', () => {
  const ranked = rankMatches([
    { ids: ['x'], rank: SEARCH_RANK.note },
    { ids: ['x'], rank: SEARCH_RANK.title },
  ]);
  assertEquals(ranked.get('x'), SEARCH_RANK.title);
});

Deno.test('no hits yields an empty map', () => {
  assertEquals(rankMatches([{ ids: [], rank: SEARCH_RANK.title }]).size, 0);
  assertEquals(rankMatches([]).size, 0);
});

Deno.test('duplicate ids within one field collapse', () => {
  const ranked = rankMatches([{ ids: ['a', 'a', 'a'], rank: SEARCH_RANK.tag }]);
  assertEquals(ranked.size, 1);
  assertEquals(ranked.get('a'), SEARCH_RANK.tag);
});
