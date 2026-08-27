import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { convertInlineAmounts, scaleInlineAmounts } from '../units.ts';

// Cook Mode renders a step as chips plus free text. The chips convert, so the
// prose has to as well. This scanner is deliberately narrower than the chip
// parser: it only fires on unambiguous unit words and refuses anything with
// range or dimension context, because a missed conversion is invisible and a
// mangled sentence is not.

// ── Conversion in prose ─────────────────────────────────────────────────────

Deno.test('tablespoons convert mid-sentence', () => {
  assertEquals(
    convertInlineAmounts('Whisk in 2 tablespoons olive oil until smooth.', 'metric'),
    'Whisk in 30 ml olive oil until smooth.',
  );
});

Deno.test('two amounts in one sentence both convert', () => {
  assertEquals(
    convertInlineAmounts('Add 1 cup flour and 1/2 cup sugar to the bowl.', 'metric'),
    'Add 240 ml flour and 120 ml sugar to the bowl.',
  );
});

Deno.test('a mixed fraction converts', () => {
  assertEquals(convertInlineAmounts('Stir in 1 1/2 cups milk.', 'metric'), 'Stir in 360 ml milk.');
});

Deno.test('pounds convert to grams', () => {
  assertEquals(convertInlineAmounts('Brown 1 lb ground beef.', 'metric'), 'Brown 454 g ground beef.');
});

Deno.test('temperatures in prose convert too', () => {
  assertEquals(
    convertInlineAmounts('Preheat oven to 425°F and bake 30 minutes.', 'metric'),
    'Preheat oven to 218°C and bake 30 minutes.',
  );
});

Deno.test('metric converts back to US', () => {
  assertEquals(
    convertInlineAmounts('Add 240 ml water and 500 g flour.', 'imperial'),
    'Add 1 cup water and 1.1 lb flour.',
  );
});

// ── Pass-through: anything the scanner can't vouch for ──────────────────────

Deno.test('a hyphenated range is left alone', () => {
  assertEquals(
    convertInlineAmounts('Add 2-3 tablespoons water as needed.', 'metric'),
    'Add 2-3 tablespoons water as needed.',
  );
});

Deno.test('a spelled-out range is left alone', () => {
  assertEquals(convertInlineAmounts('Use 2 to 3 cups broth.', 'metric'), 'Use 2 to 3 cups broth.');
});

// The guard that keeps a cup abbreviation from being read as Celsius.
Deno.test('a bare single-letter unit is never converted', () => {
  assertEquals(convertInlineAmounts('Measure out 2 C flour.', 'metric'), 'Measure out 2 C flour.');
});

Deno.test('pan dimensions are left alone', () => {
  assertEquals(convertInlineAmounts('Press into a 9x13 pan.', 'metric'), 'Press into a 9x13 pan.');
});

Deno.test('a unitless count is left alone', () => {
  assertEquals(convertInlineAmounts('Beat 2 large eggs.', 'metric'), 'Beat 2 large eggs.');
});

Deno.test('durations are not measures', () => {
  assertEquals(
    convertInlineAmounts('Simmer for 20 minutes, then rest 5 minutes.', 'metric'),
    'Simmer for 20 minutes, then rest 5 minutes.',
  );
});

Deno.test('an amount already in the target system is untouched', () => {
  assertEquals(
    convertInlineAmounts('Season with 200 g flour.', 'metric'),
    'Season with 200 g flour.',
  );
});

Deno.test('a non-measure length is left alone while a real measure converts', () => {
  assertEquals(
    convertInlineAmounts('Cut into 1 inch cubes and add 8 oz cream cheese.', 'metric'),
    'Cut into 1 inch cubes and add 227 g cream cheese.',
  );
});

Deno.test('prose with no measures is unchanged', () => {
  assertEquals(convertInlineAmounts('No amounts here at all.', 'metric'), 'No amounts here at all.');
});

Deno.test('empty string passes through', () => {
  assertEquals(convertInlineAmounts('', 'metric'), '');
});

// ── Scaling in prose, and composing the two ─────────────────────────────────

Deno.test('prose amounts scale and re-pluralize', () => {
  assertEquals(
    scaleInlineAmounts('Whisk in 2 tablespoons olive oil and 1 cup flour.', 0.5),
    'Whisk in 1 tablespoon olive oil and ½ cup flour.',
  );
});

Deno.test('scale then convert composes in prose', () => {
  const scaled = scaleInlineAmounts('Whisk in 2 tablespoons olive oil and 1 cup flour.', 0.5);
  assertEquals(
    convertInlineAmounts(scaled, 'metric'),
    'Whisk in 15 ml olive oil and 120 ml flour.',
  );
});

Deno.test('a factor of 1 leaves prose byte-for-byte alone', () => {
  assertEquals(
    scaleInlineAmounts('Whisk in 2 tablespoons olive oil.', 1),
    'Whisk in 2 tablespoons olive oil.',
  );
});

Deno.test('ranges are not scaled either', () => {
  assertEquals(scaleInlineAmounts('Add 2-3 tablespoons water.', 2), 'Add 2-3 tablespoons water.');
});
