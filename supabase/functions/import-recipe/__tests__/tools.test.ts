import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { curatedToolPrice, normalizeTools } from '../tools.ts';

// The model estimates tool prices plausibly but inconsistently — the same
// skillet comes back at a different number each import. The curated table
// pins the common cases; everything else still falls back to the model.

Deno.test('a curated tool gets the table price', () => {
  assertEquals(curatedToolPrice('Cast Iron Skillet'), '$30');
  assertEquals(curatedToolPrice('Stand Mixer'), '$380');
});

Deno.test('matching is case- and punctuation-insensitive', () => {
  assertEquals(curatedToolPrice("Chef's Knife"), '$45');
  assertEquals(curatedToolPrice('CHEFS KNIFE'), '$45');
});

Deno.test('a qualified name still matches on the keyword', () => {
  assertEquals(curatedToolPrice('12-inch Cast Iron Skillet'), '$30');
  assertEquals(curatedToolPrice('Rimmed Baking Sheet'), '$20');
});

// Ordering matters: an enameled cast iron dutch oven is a dutch oven, and an
// immersion blender is not a countertop blender.
Deno.test('specific entries win over general ones', () => {
  assertEquals(curatedToolPrice('Enameled Cast Iron Dutch Oven'), '$70');
  assertEquals(curatedToolPrice('Immersion Blender'), '$45');
  assertEquals(curatedToolPrice('Blender'), '$60');
});

Deno.test('a dough whisk is priced as itself, not as a whisk', () => {
  assertEquals(curatedToolPrice('Dough Whisk'), '$16');
  assertEquals(curatedToolPrice('Whisk'), '$12');
});

Deno.test('an unlisted tool has no curated price', () => {
  assertEquals(curatedToolPrice('Sous Vide Circulator'), null);
  assertEquals(curatedToolPrice(''), null);
});

Deno.test('normalizeTools overrides the model price on a hit', () => {
  const result = normalizeTools([{ name: 'Cast Iron Skillet', price: '$72', partner: 'Amazon' }]);
  assertEquals(result[0].price, '$30');
});

Deno.test('normalizeTools keeps the model price on a miss', () => {
  const result = normalizeTools([{ name: 'Sous Vide Circulator', price: '$149', partner: 'Amazon' }]);
  assertEquals(result[0].price, '$149');
});

Deno.test('a missing price on an unlisted tool is still an empty string', () => {
  const result = normalizeTools([{ name: 'Sous Vide Circulator', price: null }]);
  assertEquals(result[0].price, '');
  assertEquals(result[0].partner, 'Amazon');
});

Deno.test('a curated price fills in where the model gave none', () => {
  const result = normalizeTools([{ name: 'Whisk', price: null }]);
  assertEquals(result[0].price, '$12');
});
