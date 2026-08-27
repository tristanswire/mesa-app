import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { convertLeadingAmount, convertTemperatures, scaleAmount } from '../units.ts';

// convertLeadingAmount exists because Cook Mode stores ingredient chips as
// pre-rendered display strings ("2 tbsp olive oil"), not structured amounts —
// so the trailing name must survive conversion untouched.
//
// Converted metric values snap onto measures a cook actually owns — a 30 ml
// spoon exists, "29.6 ml" does not — so the expectations below are the snapped
// figures, not the raw arithmetic.

// ── US → metric ─────────────────────────────────────────────────────────────

Deno.test('tbsp converts and preserves the ingredient name', () => {
  assertEquals(convertLeadingAmount('2 tbsp olive oil', 'metric'), '30 ml olive oil');
});

Deno.test('tsp converts', () => {
  assertEquals(convertLeadingAmount('1 tsp vanilla extract', 'metric'), '5 ml vanilla extract');
});

Deno.test('cup converts', () => {
  assertEquals(convertLeadingAmount('1 cup whole milk', 'metric'), '240 ml whole milk');
});

Deno.test('oz converts to grams', () => {
  assertEquals(convertLeadingAmount('4 oz butter', 'metric'), '113 g butter');
});

Deno.test('lb converts to grams', () => {
  assertEquals(convertLeadingAmount('1 lb large shrimp', 'metric'), '454 g large shrimp');
});

// ── metric → US ─────────────────────────────────────────────────────────────

Deno.test('grams convert to ounces', () => {
  assertEquals(convertLeadingAmount('200 g flour', 'imperial'), '7.1 oz flour');
});

Deno.test('milliliters convert to cups', () => {
  assertEquals(convertLeadingAmount('240 ml water', 'imperial'), '1 cup water');
});

// ── Fractions ───────────────────────────────────────────────────────────────

Deno.test('mixed ASCII fraction', () => {
  assertEquals(convertLeadingAmount('1 1/2 cups sugar', 'metric'), '360 ml sugar');
});

Deno.test('bare ASCII fraction', () => {
  assertEquals(convertLeadingAmount('1/2 cup buttermilk', 'metric'), '120 ml buttermilk');
});

Deno.test('unicode fraction', () => {
  assertEquals(convertLeadingAmount('½ cup cream', 'metric'), '120 ml cream');
});

// ── Pass-through: no safe conversion ────────────────────────────────────────

Deno.test('unitless amount passes through unchanged', () => {
  assertEquals(convertLeadingAmount('2 large eggs', 'metric'), '2 large eggs');
});

Deno.test('ambiguous unit passes through unchanged', () => {
  assertEquals(convertLeadingAmount('a pinch of salt', 'metric'), 'a pinch of salt');
});

Deno.test('explicitly ambiguous quantity word passes through', () => {
  assertEquals(convertLeadingAmount('1 pinch cayenne', 'metric'), '1 pinch cayenne');
});

Deno.test('already in target system passes through byte-for-byte', () => {
  assertEquals(convertLeadingAmount('200 g flour', 'metric'), '200 g flour');
});

Deno.test('no leading quantity passes through', () => {
  assertEquals(convertLeadingAmount('salt and pepper to taste', 'metric'), 'salt and pepper to taste');
});

Deno.test('empty string passes through', () => {
  assertEquals(convertLeadingAmount('', 'metric'), '');
});

Deno.test('amount with no trailing name still converts', () => {
  assertEquals(convertLeadingAmount('2 tbsp', 'metric'), '30 ml');
});

// Ranges are NOT handled by the parser — "2-3 tbsp" parses as quantity 2 with
// unit text "-3 tbsp", which matches no unit pattern, so it passes through.
// Documented as a known limitation rather than silently converting half a range.
Deno.test('range passes through unconverted (known limitation)', () => {
  assertEquals(convertLeadingAmount('2-3 tbsp olive oil', 'metric'), '2-3 tbsp olive oil');
});

// ── Temperatures (prep labels) ──────────────────────────────────────────────

Deno.test('prep label temperature F converts to C', () => {
  assertEquals(
    convertTemperatures('Preheat oven to 425°F', 'metric'),
    'Preheat oven to 218°C',
  );
});

Deno.test('prep label temperature C converts to F', () => {
  assertEquals(
    convertTemperatures('Preheat oven to 200°C', 'imperial'),
    'Preheat oven to 392°F',
  );
});

Deno.test('spelled-out degrees convert', () => {
  assertEquals(
    convertTemperatures('Heat to 350 degrees F', 'metric'),
    'Heat to 177°C',
  );
});

Deno.test('temperature already in target system is untouched', () => {
  assertEquals(convertTemperatures('Preheat oven to 200°C', 'metric'), 'Preheat oven to 200°C');
});

Deno.test('multiple temperatures in one label all convert', () => {
  assertEquals(
    convertTemperatures('Proof at 80°F then bake at 450°F', 'metric'),
    'Proof at 27°C then bake at 232°C',
  );
});

// The guard that keeps "2 C flour" from being read as Celsius.
Deno.test('bare letter without degree symbol is not treated as a temperature', () => {
  assertEquals(convertTemperatures('Measure out 2 C flour', 'imperial'), 'Measure out 2 C flour');
});

Deno.test('label with no temperature is unchanged', () => {
  assertEquals(convertTemperatures('Dice the onion', 'metric'), 'Dice the onion');
});

// ── Kitchen-friendly metric rounding ────────────────────────────────────────

Deno.test('millilitres snap onto a real spoon size', () => {
  // 3 tbsp is 44.36 ml; the spoon in the drawer is 45.
  assertEquals(convertLeadingAmount('3 tbsp maple syrup', 'metric'), '45 ml maple syrup');
});

Deno.test('a value already on a clean multiple is left alone', () => {
  // 1½ cups is exactly 360 ml — snapping it onto 350 would be a different
  // quantity dressed up as a rounding.
  assertEquals(convertLeadingAmount('1 1/2 cups sugar', 'metric'), '360 ml sugar');
});

Deno.test('a cup measured as fluid ounces lands on the cup value', () => {
  assertEquals(convertLeadingAmount('8 fl oz milk', 'metric'), '240 ml milk');
});

Deno.test('grams snap to a multiple of five when close', () => {
  assertEquals(convertLeadingAmount('8 oz cream cheese', 'metric'), '227 g cream cheese');
});

Deno.test('grams too far from a multiple of five stay exact', () => {
  // 1 oz is 28.3 g — 30 would be a 6% lie, so it reports the real number.
  assertEquals(convertLeadingAmount('1 oz chocolate', 'metric'), '28 g chocolate');
});

Deno.test('sub-10ml amounts keep a decimal when nothing is close', () => {
  assertEquals(convertLeadingAmount('1/4 tsp salt', 'metric'), '1.2 ml salt');
});

Deno.test('a pound converts to the figure cookbooks print', () => {
  // 453.6 g rounds to 455 on the multiple-of-5 rule; 454 is the number a cook
  // recognizes, so it is pinned as an exception.
  assertEquals(convertLeadingAmount('1 lb butter', 'metric'), '454 g butter');
});

Deno.test('a clean value near the landmark is not rewritten', () => {
  // 910 g halved is exactly 455 — a real measurement, not a stray pound.
  assertEquals(scaleAmount('910 g flour', 0.5), '455 g flour');
});

Deno.test('the pound family lands on figures cooks recognize', () => {
  assertEquals(convertLeadingAmount('1/2 lb pancetta', 'metric'), '227 g pancetta');
  assertEquals(convertLeadingAmount('2 lbs potatoes', 'metric'), '907 g potatoes');
});

Deno.test('a clean value beside a landmark keeps its own number', () => {
  // 450 g halved is 225, a real measurement — not a stray half-pound.
  assertEquals(scaleAmount('450 g flour', 0.5), '225 g flour');
});
