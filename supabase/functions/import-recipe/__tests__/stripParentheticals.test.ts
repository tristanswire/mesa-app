import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { stripParentheticals } from '../text.ts';

// The reported bug: recipe plugins emit a metric conversion that's already
// wrapped, so the ingredient arrives with doubled parens.
Deno.test('strips doubled parens from an embedded metric conversion', () => {
  assertEquals(
    stripParentheticals('1/4 cup all-purpose flour ((30 grams))'),
    '1/4 cup all-purpose flour',
  );
});

Deno.test('strips a mid-string parenthetical and collapses the gap', () => {
  assertEquals(stripParentheticals('sugar (200g) sifted'), 'sugar sifted');
});

Deno.test('does not strand a space before punctuation', () => {
  assertEquals(stripParentheticals('2 cups sugar (200g), sifted'), '2 cups sugar, sifted');
});

Deno.test('leaves paren-free text byte-for-byte unchanged', () => {
  // Double space is intentional — untouched input must not be reformatted.
  assertEquals(stripParentheticals('1 tbsp  olive oil'), '1 tbsp  olive oil');
});

Deno.test('handles unbalanced parens and multiple segments', () => {
  // Unterminated: the allowlist only fires on a segment we saw close, so this
  // is dropped like any other unterminated aside.
  assertEquals(stripParentheticals('kosher salt (to taste'), 'kosher salt');
  assertEquals(stripParentheticals('(about) 3 cloves garlic (minced)'), '3 cloves garlic');
  // An entry that is nothing but a measurement parenthetical empties out;
  // parseIngredients filters those away.
  assertEquals(stripParentheticals('(30 grams)'), '');
});

// --- Semantic allowlist -----------------------------------------------------

Deno.test('keeps allowlisted parentheticals intact', () => {
  assertEquals(stripParentheticals('1 tsp salt (optional)'), '1 tsp salt (optional)');
  assertEquals(stripParentheticals('2 tbsp butter (divided)'), '2 tbsp butter (divided)');
  assertEquals(stripParentheticals('black pepper (to taste)'), 'black pepper (to taste)');
  // Casing and inner spacing are preserved — the allowlist decides whether to
  // keep, not how to rewrite.
  assertEquals(stripParentheticals('flaky sea salt ( Optional )'), 'flaky sea salt ( Optional )');
});

Deno.test('removes parentheticals that are not on the allowlist', () => {
  assertEquals(stripParentheticals('3/4 cup (170g) butter (softened)'), '3/4 cup butter');
  // Exact phrase only — a longer aside that merely contains the word is noise.
  assertEquals(stripParentheticals('1 cup pecans (optional, but good)'), '1 cup pecans');
});

Deno.test('mixes kept and removed parentheticals in one string', () => {
  assertEquals(stripParentheticals('1 cup flour (120g) (divided)'), '1 cup flour (divided)');
  assertEquals(
    stripParentheticals('1/4 cup sugar ((50 grams)), (to taste)'),
    '1/4 cup sugar, (to taste)',
  );
});
