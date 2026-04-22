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

export type MockStep = {
  id: string;
  instruction: string;
  ingredientRefs: string[];
  timers?: { label: string; durationSeconds: number }[];
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
      { id: 'step-1', instruction: 'Preheat oven to 425°F.', ingredientRefs: [] },
      { id: 'step-2', instruction: 'Toss chicken thighs with harissa, cumin, olive oil, and kosher salt.', ingredientRefs: ['ing-3', 'ing-4', 'ing-7', 'ing-1', 'ing-8'] },
      { id: 'step-3', instruction: 'Scatter onion, chickpeas, and garlic on a sheet pan. Nestle the chicken on top.', ingredientRefs: ['ing-5', 'ing-6', 'ing-2'] },
      { id: 'step-4', instruction: 'Roast until chicken is golden and cooked through, about 25 minutes.', ingredientRefs: [], timers: [{ label: 'roast 25 min', durationSeconds: 1500 }] },
      { id: 'step-5', instruction: 'Finish with flaky sea salt and serve directly from the pan.', ingredientRefs: ['ing-9'] },
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
      { id: 'step-1', instruction: 'Toss broccoli with olive oil and a generous pinch of salt.', ingredientRefs: ['ing-1', 'ing-5'] },
      { id: 'step-2', instruction: 'Roast at 450°F until florets are deeply charred at the edges, about 15 minutes.', ingredientRefs: [], timers: [{ label: 'roast 15 min', durationSeconds: 900 }] },
      { id: 'step-3', instruction: 'Whisk tahini with lemon juice, garlic, and 2 tbsp water. Drizzle over broccoli.', ingredientRefs: ['ing-2', 'ing-3', 'ing-4'] },
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
      { id: 'step-1', instruction: 'Whisk together miso, rice vinegar, and sesame oil.', ingredientRefs: ['ing-2', 'ing-3', 'ing-4'] },
      { id: 'step-2', instruction: 'Brush glaze over salmon fillets. Broil 4 inches from heat for 8 minutes.', ingredientRefs: ['ing-1'], timers: [{ label: 'broil 8 min', durationSeconds: 480 }] },
      { id: 'step-3', instruction: 'Serve over rice with remaining glaze spooned on top.', ingredientRefs: ['ing-5'] },
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
      { id: 'step-1', instruction: 'Preheat oven to 425°F with a 10-inch cast iron skillet inside.', ingredientRefs: [] },
      { id: 'step-2', instruction: 'Blend eggs, flour, and milk until smooth.', ingredientRefs: ['ing-1', 'ing-2', 'ing-3'] },
      { id: 'step-3', instruction: 'Melt butter in the hot skillet, pour in batter, and bake 20 minutes until puffed and golden.', ingredientRefs: ['ing-4'], timers: [{ label: 'bake 20 min', durationSeconds: 1200 }] },
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
