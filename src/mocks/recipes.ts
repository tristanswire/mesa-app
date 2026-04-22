export type MockPrepItem = {
  id: string;
  label: string;
  duration?: string;
  defaultChecked?: boolean;
};

export type MockTool = {
  id: string;
  name: string;
  price: string;
  partner: string;
};

export type MockIngredient = {
  id: string;
  amount: string;
  name: string;
  prep?: string;
};

export type MockStepSegment =
  | { type: 'text'; content: string }
  | { type: 'ingredient'; ingredientId: string }
  | { type: 'timer'; timerId: string };

export type MockStep = {
  id: string;
  segments: MockStepSegment[];
  ingredients: { id: string; display: string }[];
  timers: { id: string; label: string; durationSeconds: number }[];
};

export type MockRecipe = {
  id: string;
  title: string;
  duration: string;
  servings: number;
  tag: string;
  tintKey: 'terracotta' | 'olive';
  ingredients: MockIngredient[];
  steps: MockStep[];
  prepItems?: MockPrepItem[];
  tools?: MockTool[];
};

export const MOCK_RECIPES: Record<string, MockRecipe> = {
  'harissa-chicken': {
    id: 'harissa-chicken',
    title: 'Sheet-pan Harissa Chicken',
    duration: '35 min',
    servings: 4,
    tag: 'Weeknight',
    tintKey: 'terracotta',
    ingredients: [
      { id: 'ing-1', amount: '2 tbsp', name: 'olive oil' },
      { id: 'ing-2', amount: '3 cloves', name: 'garlic', prep: 'minced' },
      { id: 'ing-3', amount: '1 lb', name: 'chicken thighs' },
      { id: 'ing-4', amount: '1 tsp', name: 'harissa paste' },
      { id: 'ing-5', amount: '1', name: 'red onion', prep: 'sliced' },
      { id: 'ing-6', amount: '1 can', name: 'chickpeas', prep: 'drained' },
      { id: 'ing-7', amount: '1 tsp', name: 'cumin' },
      { id: 'ing-8', amount: '1 tsp', name: 'kosher salt' },
      { id: 'ing-9', amount: 'to taste', name: 'flaky sea salt' },
    ],
    steps: [
      {
        id: 'step-1',
        segments: [
          { type: 'text', content: 'Preheat oven to 425°F.' },
        ],
        ingredients: [],
        timers: [],
      },
      {
        id: 'step-2',
        segments: [
          { type: 'text', content: 'Toss ' },
          { type: 'ingredient', ingredientId: 'ing-3' },
          { type: 'text', content: ' with ' },
          { type: 'ingredient', ingredientId: 'ing-4' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-7' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-1' },
          { type: 'text', content: ', and ' },
          { type: 'ingredient', ingredientId: 'ing-8' },
          { type: 'text', content: '.' },
        ],
        ingredients: [
          { id: 'ing-1', display: '2 tbsp olive oil' },
          { id: 'ing-3', display: '1 lb chicken thighs' },
          { id: 'ing-4', display: '1 tsp harissa paste' },
          { id: 'ing-7', display: '1 tsp cumin' },
          { id: 'ing-8', display: '1 tsp kosher salt' },
        ],
        timers: [],
      },
      {
        id: 'step-3',
        segments: [
          { type: 'text', content: 'Scatter ' },
          { type: 'ingredient', ingredientId: 'ing-5' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-6' },
          { type: 'text', content: ', and ' },
          { type: 'ingredient', ingredientId: 'ing-2' },
          { type: 'text', content: ' on a sheet pan. Nestle the chicken on top.' },
        ],
        ingredients: [
          { id: 'ing-2', display: '3 cloves garlic' },
          { id: 'ing-5', display: '1 red onion' },
          { id: 'ing-6', display: '1 can chickpeas' },
        ],
        timers: [],
      },
      {
        id: 'step-4',
        segments: [
          { type: 'text', content: 'Roast until chicken is golden and cooked through — ' },
          { type: 'timer', timerId: 'timer-1' },
          { type: 'text', content: '.' },
        ],
        ingredients: [],
        timers: [{ id: 'timer-1', label: 'roast 25 min', durationSeconds: 1500 }],
      },
      {
        id: 'step-5',
        segments: [
          { type: 'text', content: 'Finish with ' },
          { type: 'ingredient', ingredientId: 'ing-9' },
          { type: 'text', content: ' and serve directly from the pan.' },
        ],
        ingredients: [
          { id: 'ing-9', display: 'flaky sea salt' },
        ],
        timers: [],
      },
    ],
    prepItems: [
      { id: 'prep-1', label: 'Preheat oven to 425°F', duration: '20 min', defaultChecked: true },
      { id: 'prep-2', label: 'Take chicken out to temper', duration: '15 min', defaultChecked: true },
      { id: 'prep-3', label: 'Dice 1 onion and mince 3 cloves garlic' },
      { id: 'prep-4', label: 'Measure 2 tbsp olive oil · 1 tsp cumin' },
      { id: 'prep-5', label: 'Pat chicken thighs dry' },
    ],
    tools: [
      { id: 'tool-1', name: 'Nordic Ware Half Sheet Pan', price: '$28', partner: 'Amazon' },
      { id: 'tool-2', name: 'Microplane Classic Zester', price: '$15', partner: 'Sur La Table' },
      { id: 'tool-3', name: 'OXO Good Grips Can Opener', price: '$12', partner: 'Amazon' },
    ],
  },

  'broccoli-tahini': {
    id: 'broccoli-tahini',
    title: 'Charred Broccoli Tahini',
    duration: '20 min',
    servings: 2,
    tag: 'Side',
    tintKey: 'olive',
    ingredients: [
      { id: 'ing-1', amount: '1 head', name: 'broccoli', prep: 'cut into florets' },
      { id: 'ing-2', amount: '3 tbsp', name: 'tahini' },
      { id: 'ing-3', amount: '1', name: 'lemon', prep: 'juiced' },
      { id: 'ing-4', amount: '1 clove', name: 'garlic', prep: 'grated' },
      { id: 'ing-5', amount: '2 tbsp', name: 'olive oil' },
    ],
    steps: [
      {
        id: 'step-1',
        segments: [
          { type: 'text', content: 'Toss ' },
          { type: 'ingredient', ingredientId: 'ing-1' },
          { type: 'text', content: ' with ' },
          { type: 'ingredient', ingredientId: 'ing-5' },
          { type: 'text', content: ' and a generous pinch of salt.' },
        ],
        ingredients: [
          { id: 'ing-1', display: '1 head broccoli' },
          { id: 'ing-5', display: '2 tbsp olive oil' },
        ],
        timers: [],
      },
      {
        id: 'step-2',
        segments: [
          { type: 'text', content: 'Roast at 450°F until florets are deeply charred at the edges — ' },
          { type: 'timer', timerId: 'timer-1' },
          { type: 'text', content: '.' },
        ],
        ingredients: [],
        timers: [{ id: 'timer-1', label: 'roast 15 min', durationSeconds: 900 }],
      },
      {
        id: 'step-3',
        segments: [
          { type: 'text', content: 'Whisk ' },
          { type: 'ingredient', ingredientId: 'ing-2' },
          { type: 'text', content: ' with ' },
          { type: 'ingredient', ingredientId: 'ing-3' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-4' },
          { type: 'text', content: ', and 2 tbsp water. Drizzle over broccoli.' },
        ],
        ingredients: [
          { id: 'ing-2', display: '3 tbsp tahini' },
          { id: 'ing-3', display: '1 lemon, juiced' },
          { id: 'ing-4', display: '1 clove garlic' },
        ],
        timers: [],
      },
    ],
    prepItems: [
      { id: 'prep-1', label: 'Preheat oven to 450°F', duration: '15 min' },
      { id: 'prep-2', label: 'Cut broccoli into florets' },
      { id: 'prep-3', label: 'Grate garlic clove' },
      { id: 'prep-4', label: 'Juice lemon' },
    ],
    tools: [
      { id: 'tool-1', name: 'Nordic Ware Half Sheet Pan', price: '$28', partner: 'Amazon' },
      { id: 'tool-2', name: 'Microplane Classic Zester', price: '$15', partner: 'Sur La Table' },
    ],
  },

  'miso-salmon': {
    id: 'miso-salmon',
    title: 'Miso Salmon Bowls',
    duration: '25 min',
    servings: 2,
    tag: 'Weeknight',
    tintKey: 'olive',
    ingredients: [
      { id: 'ing-1', amount: '2', name: 'salmon fillets' },
      { id: 'ing-2', amount: '2 tbsp', name: 'white miso' },
      { id: 'ing-3', amount: '1 tbsp', name: 'rice vinegar' },
      { id: 'ing-4', amount: '1 tsp', name: 'sesame oil' },
      { id: 'ing-5', amount: '1 cup', name: 'cooked rice' },
    ],
    steps: [
      {
        id: 'step-1',
        segments: [
          { type: 'text', content: 'Whisk together ' },
          { type: 'ingredient', ingredientId: 'ing-2' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-3' },
          { type: 'text', content: ', and ' },
          { type: 'ingredient', ingredientId: 'ing-4' },
          { type: 'text', content: '.' },
        ],
        ingredients: [
          { id: 'ing-2', display: '2 tbsp white miso' },
          { id: 'ing-3', display: '1 tbsp rice vinegar' },
          { id: 'ing-4', display: '1 tsp sesame oil' },
        ],
        timers: [],
      },
      {
        id: 'step-2',
        segments: [
          { type: 'text', content: 'Brush glaze over ' },
          { type: 'ingredient', ingredientId: 'ing-1' },
          { type: 'text', content: '. Broil 4 inches from heat — ' },
          { type: 'timer', timerId: 'timer-1' },
          { type: 'text', content: '.' },
        ],
        ingredients: [
          { id: 'ing-1', display: '2 salmon fillets' },
        ],
        timers: [{ id: 'timer-1', label: 'broil 8 min', durationSeconds: 480 }],
      },
      {
        id: 'step-3',
        segments: [
          { type: 'text', content: 'Serve over ' },
          { type: 'ingredient', ingredientId: 'ing-5' },
          { type: 'text', content: ' with remaining glaze spooned on top.' },
        ],
        ingredients: [
          { id: 'ing-5', display: '1 cup cooked rice' },
        ],
        timers: [],
      },
    ],
    prepItems: [
      { id: 'prep-1', label: 'Preheat broiler to high', duration: '5 min' },
      { id: 'prep-2', label: 'Position rack 4 inches from broiler element' },
      { id: 'prep-3', label: 'Cook rice per package instructions', duration: '20 min' },
    ],
    tools: [
      { id: 'tool-1', name: 'All-Clad Stainless Broiler Pan', price: '$45', partner: 'Williams Sonoma' },
      { id: 'tool-2', name: 'OXO Silicone Basting Brush', price: '$10', partner: 'Amazon' },
    ],
  },

  'dutch-baby': {
    id: 'dutch-baby',
    title: 'Dutch Baby',
    duration: '30 min',
    servings: 2,
    tag: 'Breakfast',
    tintKey: 'olive',
    ingredients: [
      { id: 'ing-1', amount: '3', name: 'eggs' },
      { id: 'ing-2', amount: '½ cup', name: 'all-purpose flour' },
      { id: 'ing-3', amount: '½ cup', name: 'whole milk' },
      { id: 'ing-4', amount: '2 tbsp', name: 'unsalted butter' },
      { id: 'ing-5', amount: '1 tbsp', name: 'powdered sugar' },
    ],
    steps: [
      {
        id: 'step-1',
        segments: [
          { type: 'text', content: 'Preheat oven to 425°F with a 10-inch cast iron skillet inside.' },
        ],
        ingredients: [],
        timers: [],
      },
      {
        id: 'step-2',
        segments: [
          { type: 'text', content: 'Blend ' },
          { type: 'ingredient', ingredientId: 'ing-1' },
          { type: 'text', content: ', ' },
          { type: 'ingredient', ingredientId: 'ing-2' },
          { type: 'text', content: ', and ' },
          { type: 'ingredient', ingredientId: 'ing-3' },
          { type: 'text', content: ' until smooth.' },
        ],
        ingredients: [
          { id: 'ing-1', display: '3 eggs' },
          { id: 'ing-2', display: '½ cup flour' },
          { id: 'ing-3', display: '½ cup whole milk' },
        ],
        timers: [],
      },
      {
        id: 'step-3',
        segments: [
          { type: 'text', content: 'Melt ' },
          { type: 'ingredient', ingredientId: 'ing-4' },
          { type: 'text', content: ' in the hot skillet, pour in batter, and bake — ' },
          { type: 'timer', timerId: 'timer-1' },
          { type: 'text', content: ' — until puffed and golden.' },
        ],
        ingredients: [
          { id: 'ing-4', display: '2 tbsp butter' },
        ],
        timers: [{ id: 'timer-1', label: 'bake 20 min', durationSeconds: 1200 }],
      },
    ],
    prepItems: [
      { id: 'prep-1', label: 'Place cast iron skillet in cold oven, preheat to 425°F', duration: '15 min' },
      { id: 'prep-2', label: 'Measure and combine eggs, flour, and milk' },
      { id: 'prep-3', label: 'Blend batter until completely smooth' },
    ],
    tools: [
      { id: 'tool-1', name: 'Lodge 10" Cast Iron Skillet', price: '$35', partner: 'Amazon' },
      { id: 'tool-2', name: 'Vitamix Immersion Blender', price: '$80', partner: 'Williams Sonoma' },
    ],
  },
};

export function getMockRecipe(id: string): MockRecipe | undefined {
  return MOCK_RECIPES[id];
}

export function getMockRecipeOrFallback(id: string): MockRecipe {
  return MOCK_RECIPES[id] ?? MOCK_RECIPES['harissa-chicken'];
}
