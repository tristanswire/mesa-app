import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { convertLeadingAmount, formatQuantity, scaleAmount } from '../units.ts';

// scaleAmount is the session-only serving-scale transform. Like the metric
// conversion it parses the leading amount, rewrites it, and leaves the trailing
// ingredient name alone — so the same pass-through discipline is pinned here.

// ── Halving, quartering, doubling ───────────────────────────────────────────

Deno.test('halving a whole US amount', () => {
  assertEquals(scaleAmount('2 cups flour', 0.5), '1 cup flour');
});

Deno.test('quartering a whole US amount', () => {
  assertEquals(scaleAmount('2 cups flour', 0.25), '½ cup flour');
});

Deno.test('doubling a whole US amount', () => {
  assertEquals(scaleAmount('1 cup whole milk', 2), '2 cups whole milk');
});

Deno.test('halving an abbreviated unit leaves the abbreviation alone', () => {
  assertEquals(scaleAmount('2 tbsp olive oil', 0.5), '1 tbsp olive oil');
});

Deno.test('scaling by 1 returns the input untouched', () => {
  assertEquals(scaleAmount('1 1/2 cups sugar', 1), '1 1/2 cups sugar');
});

// ── Fraction output ─────────────────────────────────────────────────────────

Deno.test('halving a mixed amount yields a cooking fraction, not a decimal', () => {
  assertEquals(scaleAmount('1 1/2 cups sugar', 0.5), '¾ cup sugar');
});

Deno.test('quartering yields an eighth', () => {
  assertEquals(scaleAmount('1 tsp vanilla extract', 0.25), '¼ tsp vanilla extract');
});

Deno.test('thirds render as ⅓ rather than 0.33', () => {
  assertEquals(scaleAmount('1 lb large shrimp', 1 / 3), '⅓ lb large shrimp');
});

Deno.test('a mixed result keeps the whole number glued to the fraction', () => {
  assertEquals(scaleAmount('1 cup rice', 1.5), '1½ cups rice');
});

// A positive amount must never round away to nothing — better to over-measure
// a trace than to silently drop the ingredient.
Deno.test('a tiny scaled amount floors at an eighth instead of zero', () => {
  assertEquals(scaleAmount('1/4 tsp salt', 0.25), '⅛ tsp salt');
});

Deno.test('amounts above 10 round to whole units', () => {
  assertEquals(scaleAmount('16 oz stock', 0.8), '13 oz stock');
});

// ── Unit pluralization ──────────────────────────────────────────────────────

Deno.test('word units pluralize when scaling up', () => {
  assertEquals(scaleAmount('1 tablespoon butter', 3), '3 tablespoons butter');
});

Deno.test('word units singularize when scaling down', () => {
  assertEquals(scaleAmount('2 teaspoons salt', 0.5), '1 teaspoon salt');
});

// ── Fraction input ──────────────────────────────────────────────────────────

Deno.test('mixed unicode fraction input with a space', () => {
  assertEquals(scaleAmount('1 ½ cups sugar', 0.5), '¾ cup sugar');
});

Deno.test('mixed unicode fraction input without a space', () => {
  assertEquals(scaleAmount('1½ cups sugar', 0.5), '¾ cup sugar');
});

Deno.test('bare ASCII fraction input', () => {
  assertEquals(scaleAmount('1/2 cup buttermilk', 2), '1 cup buttermilk');
});

Deno.test('bare unicode fraction input', () => {
  assertEquals(scaleAmount('½ cup cream', 2), '1 cup cream');
});

// ── Metric stays decimal ────────────────────────────────────────────────────

Deno.test('metric mass scales as a decimal, not a fraction', () => {
  assertEquals(scaleAmount('200 g flour', 0.5), '100 g flour');
});

Deno.test('metric volume scales as a decimal', () => {
  assertEquals(scaleAmount('240 ml water', 0.25), '60 ml water');
});

// ── Unitless counts ─────────────────────────────────────────────────────────

// The trailing noun is never rewritten (same rule as the metric round), so a
// halved "2 large eggs" reads "1 large eggs". Pinned as a known artifact.
Deno.test('unitless counts scale, noun untouched', () => {
  assertEquals(scaleAmount('2 large eggs', 2), '4 large eggs');
  assertEquals(scaleAmount('2 large eggs', 0.5), '1 large eggs');
});

Deno.test('a bare quantity with no unit or name scales', () => {
  assertEquals(scaleAmount('4', 0.5), '2');
});

// ── Composition with metric conversion ──────────────────────────────────────

// The UI scales first, then converts. scaleAmount's own output ("¾ cup",
// "1½ cups") therefore has to parse back cleanly.
Deno.test('scale then convert: halved cups become millilitres', () => {
  assertEquals(convertLeadingAmount(scaleAmount('1 1/2 cups sugar', 0.5), 'metric'), '180 ml sugar');
});

Deno.test('scale then convert: doubled tbsp becomes millilitres', () => {
  assertEquals(convertLeadingAmount(scaleAmount('2 tbsp olive oil', 2), 'metric'), '59.1 ml olive oil');
});

Deno.test('scale then convert: a mixed-fraction result round-trips', () => {
  assertEquals(convertLeadingAmount(scaleAmount('1 cup rice', 1.5), 'metric'), '360 ml rice');
});

Deno.test('scale then convert is a no-op when already metric', () => {
  assertEquals(convertLeadingAmount(scaleAmount('200 g flour', 0.5), 'metric'), '100 g flour');
});

// ── Pass-throughs ───────────────────────────────────────────────────────────

Deno.test('range passes through unscaled', () => {
  assertEquals(scaleAmount('2-3 tbsp olive oil', 2), '2-3 tbsp olive oil');
});

Deno.test('spelled-out range passes through unscaled', () => {
  assertEquals(scaleAmount('2 to 3 cups broth', 2), '2 to 3 cups broth');
});

Deno.test('pan dimensions pass through unscaled', () => {
  assertEquals(scaleAmount('9x13 pan', 2), '9x13 pan');
});

Deno.test('ambiguous measures pass through unscaled', () => {
  assertEquals(scaleAmount('1 pinch cayenne', 2), '1 pinch cayenne');
});

Deno.test('a temperature in an amount slot passes through', () => {
  assertEquals(scaleAmount('425°F', 2), '425°F');
});

Deno.test('text with no leading quantity passes through', () => {
  assertEquals(scaleAmount('salt and pepper to taste', 2), 'salt and pepper to taste');
});

Deno.test('mid-sentence quantities are never touched', () => {
  assertEquals(scaleAmount('Measure out 2 cups flour', 2), 'Measure out 2 cups flour');
});

Deno.test('empty string passes through', () => {
  assertEquals(scaleAmount('', 2), '');
});

Deno.test('a non-positive factor passes through', () => {
  assertEquals(scaleAmount('2 cups flour', 0), '2 cups flour');
});

// ── formatQuantity (servings display) ───────────────────────────────────────

Deno.test('whole servings render without a fraction', () => {
  assertEquals(formatQuantity(4), '4');
});

Deno.test('fractional servings render as a mixed fraction', () => {
  assertEquals(formatQuantity(1.5), '1½');
});

Deno.test('a sub-one serving renders as a bare fraction', () => {
  assertEquals(formatQuantity(0.5), '½');
});
