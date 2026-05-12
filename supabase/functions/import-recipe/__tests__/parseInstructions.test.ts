import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { parseInstructions } from '../jsonld.ts';

type Fixture = {
  source: string;
  expectedSteps: number;
  note: string;
  recipeInstructions: unknown;
};

async function loadFixture(name: string): Promise<Fixture> {
  const url = new URL(`./fixtures/${name}.json`, import.meta.url);
  const text = await Deno.readTextFile(url);
  return JSON.parse(text) as Fixture;
}

// --- Bug case ---------------------------------------------------------------

Deno.test('hbh: single HowToStep with numbered list splits into 4 steps', async () => {
  const fx = await loadFixture('hbh');
  const steps = parseInstructions(fx.recipeInstructions);

  assertEquals(steps.length, fx.expectedSteps);
  // First step starts at "Drain" — the leading "1. " prefix is stripped.
  assertEquals(steps[0].text.startsWith('Drain'), true);
  // No step retains its numbered prefix.
  for (const s of steps) {
    assertEquals(/^\d+\.\s/.test(s.text), false);
  }
  // Final step is the short closing instruction.
  assertEquals(steps[3].text.startsWith('Serve'), true);
});

// --- Regression guards: well-formed HowToStep[] ----------------------------

Deno.test('poy: well-formed HowToStep[] preserves 3 steps', async () => {
  const fx = await loadFixture('poy');
  const steps = parseInstructions(fx.recipeInstructions);
  assertEquals(steps.length, fx.expectedSteps);
  assertEquals(steps[0].text.startsWith('Place all ingredients'), true);
});

Deno.test('mb: well-formed HowToStep[] preserves 10 steps', async () => {
  const fx = await loadFixture('mb');
  const steps = parseInstructions(fx.recipeInstructions);
  assertEquals(steps.length, fx.expectedSteps);
});

Deno.test('ba: non-WPRM HowToStep[] preserves 4 steps (control)', async () => {
  const fx = await loadFixture('ba');
  const steps = parseInstructions(fx.recipeInstructions);
  assertEquals(steps.length, fx.expectedSteps);
});

// --- HowToSection nesting ---------------------------------------------------

Deno.test('howtosection: nested itemListElement flattens to 4 steps', async () => {
  const fx = await loadFixture('howtosection');
  const steps = parseInstructions(fx.recipeInstructions);
  assertEquals(steps.length, fx.expectedSteps);
  assertEquals(steps[0].text.startsWith('Preheat oven'), true);
  assertEquals(steps[2].text.startsWith('Beat softened butter'), true);
});

// --- Edge cases the splitter must NOT trip on -------------------------------

Deno.test('numbered-list splitter ignores decimal amounts inside a single step', () => {
  const single = [
    {
      '@type': 'HowToStep',
      text:
        'Whisk 1.5 cups flour with 2.5 teaspoons baking powder until evenly combined.',
    },
  ];
  const steps = parseInstructions(single);
  assertEquals(steps.length, 1);
});

Deno.test('numbered-list splitter leaves a single non-numbered step alone', () => {
  const single = [
    {
      '@type': 'HowToStep',
      text: 'Heat oil in a large skillet over medium heat until shimmering.',
    },
  ];
  const steps = parseInstructions(single);
  assertEquals(steps.length, 1);
});
