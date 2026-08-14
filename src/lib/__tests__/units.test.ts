import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { convertLeadingAmount, convertTemperatures } from '../units.ts';

// convertLeadingAmount exists because Cook Mode stores ingredient chips as
// pre-rendered display strings ("2 tbsp olive oil"), not structured amounts —
// so the trailing name must survive conversion untouched.

// ── US → metric ─────────────────────────────────────────────────────────────

Deno.test('tbsp converts and preserves the ingredient name', () => {
  assertEquals(convertLeadingAmount('2 tbsp olive oil', 'metric'), '29.6 ml olive oil');
});

Deno.test('tsp converts', () => {
  assertEquals(convertLeadingAmount('1 tsp vanilla extract', 'metric'), '4.9 ml vanilla extract');
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
  assertEquals(convertLeadingAmount('2 tbsp', 'metric'), '29.6 ml');
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
