import type { ParsedIngredient, ParsedPrepItem, ParsedTool } from './types.ts';

export type ParsedIngredientWithId = ParsedIngredient & { id: string };

export type PartialRecipe = {
  title: string;
  duration: string;
  servings: number;
  tag: string | null;
  imageUrl: string | null;
  ingredients: ParsedIngredientWithId[];
  plainSteps: { text: string }[];
  prepItems: ParsedPrepItem[];
  tools: ParsedTool[];
};

export function parseJsonLd(html: string): PartialRecipe | null {
  const recipes = extractRecipeNodes(html);
  if (recipes.length === 0) return null;

  const recipe = recipes[0];
  return normalizeRecipe(recipe);
}

function extractRecipeNodes(html: string): any[] {
  const recipes: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonText = match[1].trim();
    if (!jsonText) continue;

    try {
      const parsed = JSON.parse(jsonText);
      collectRecipes(parsed, recipes);
    } catch {
      continue;
    }
  }

  return recipes;
}

function collectRecipes(node: any, recipes: any[]) {
  if (!node) return;

  if (typeof node === 'object' && !Array.isArray(node)) {
    const types = normalizeTypes(node['@type']);
    if (types.includes('Recipe')) {
      recipes.push(node);
    }
    if (node['@graph']) {
      collectRecipes(node['@graph'], recipes);
    }
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectRecipes(item, recipes);
    }
  }
}

function normalizeTypes(type: any): string[] {
  if (!type) return [];
  if (typeof type === 'string') return [type];
  if (Array.isArray(type)) return type.filter((t) => typeof t === 'string');
  return [];
}

function normalizeRecipe(node: any): PartialRecipe | null {
  const title = stripHtml(getString(node.name));
  if (!title) return null;

  const ingredients = parseIngredients(node.recipeIngredient);
  if (ingredients.length === 0) return null;

  const plainSteps = parseInstructions(node.recipeInstructions);
  if (plainSteps.length === 0) return null;

  const imageUrl = extractImageUrl(node);

  return {
    title,
    duration: parseDuration(node.totalTime || node.cookTime || node.prepTime),
    servings: parseServings(node.recipeYield),
    tag: guessTag(node),
    imageUrl,
    ingredients,
    plainSteps,
    prepItems: derivePrepItems(plainSteps),
    tools: parseTools(node.tool),
  };
}

/**
 * JSON-LD's `image` field can be: string URL, array, ImageObject with url, or array of ImageObjects.
 */
function extractImageUrl(node: any): string | null {
  const image = node.image;
  if (!image) return null;

  if (typeof image === 'string') return image;

  if (Array.isArray(image)) {
    for (const item of image) {
      const url = extractImageUrl({ image: item });
      if (url) return url;
    }
    return null;
  }

  if (typeof image === 'object') {
    if (typeof image.url === 'string') return image.url;
    if (typeof image['@id'] === 'string') return image['@id'];
  }

  return null;
}

function getString(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find((v) => typeof v === 'string') || '';
  if (value && typeof value === 'object' && typeof value['@value'] === 'string') return value['@value'];
  return '';
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function parseDuration(value: any): string {
  const text = getString(value);
  if (!text) return '30 min';

  const match = text.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return '30 min';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`;
  if (hours > 0) return `${hours} hr`;
  if (minutes > 0) return `${minutes} min`;
  return '30 min';
}

function parseServings(value: any): number {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) {
    for (const v of value) {
      const num = parseServings(v);
      if (num > 0) return num;
    }
  }
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 4;
}

function parseIngredients(value: any): ParsedIngredientWithId[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw) => stripHtml(getString(raw)))
    .filter((text) => text.length > 0)
    .map((text, idx) => {
      const split = splitIngredient(text);
      return { ...split, id: `ing-${idx + 1}` };
    });
}

function splitIngredient(text: string): ParsedIngredient {
  const amountMatch = text.match(
    /^([\d¼-¾⅐-⅞\/\.\s]+(?:cups?|tbsps?|tbls?|tablespoons?|tsps?|teaspoons?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|l|cloves?|sprigs?|sticks?|cans?|pinch(?:es)?|dashes?|slices?|pieces?|bunch(?:es)?|stalks?|heads?)?)\s+(.+)/i,
  );

  let amount = '';
  let rest = text;

  if (amountMatch) {
    amount = amountMatch[1].trim();
    rest = amountMatch[2].trim();
  } else {
    const numMatch = text.match(/^([\d¼-¾⅐-⅞\/\.\s]+)\s+(.+)/);
    if (numMatch) {
      amount = numMatch[1].trim();
      rest = numMatch[2].trim();
    }
  }

  let name = rest;
  let prep: string | null = null;
  const commaIdx = rest.indexOf(',');
  if (commaIdx !== -1) {
    name = rest.slice(0, commaIdx).trim();
    prep = rest.slice(commaIdx + 1).trim() || null;
  }

  if (!amount) {
    return { amount: '', name: rest, prep: null };
  }

  return { amount, name, prep };
}

// Exported for unit testing — __tests__/parseInstructions.test.ts asserts
// behavior against fixtures captured from real-world JSON-LD blobs.
export function parseInstructions(value: any): { text: string }[] {
  if (!Array.isArray(value)) {
    if (typeof value === 'string') {
      return splitStringInstructions(value);
    }
    return [];
  }

  const steps: { text: string }[] = [];

  for (const item of value) {
    if (typeof item === 'string') {
      const text = stripHtml(item);
      if (text) steps.push({ text });
      continue;
    }

    if (!item || typeof item !== 'object') continue;

    const types = normalizeTypes(item['@type']);

    if (types.includes('HowToSection')) {
      const sectionSteps = parseInstructions(item.itemListElement);
      steps.push(...sectionSteps);
      continue;
    }

    if (types.includes('HowToStep') || item.text) {
      const text = stripHtml(getString(item.text));
      if (text) steps.push({ text });
    }
  }

  // Post-process: some WordPress recipe plugins (notably WP Recipe Maker on
  // Half Baked Harvest) emit a single HowToStep whose .text contains every
  // numbered step concatenated, when the recipe author wrote all instructions
  // into one textarea instead of separate step inputs. Detect that case and
  // re-split on the embedded numbered prefixes.
  //
  // TODO V1.1: even after splitting, the splitStringInstructions fallback for
  // plain-string recipeInstructions naively splits on sentence boundaries —
  // so "Cook 5 minutes. Add garlic" becomes two steps. A more careful pass
  // (likely a small LLM call) would respect cooking semantics. Defer unless
  // beta feedback surfaces it.
  if (steps.length === 1) {
    const split = splitNumberedList(steps[0].text);
    if (split.length >= 2) return split.map((text) => ({ text }));
  }

  return steps;
}

// Detect "1. ... 2. ... 3. ..." numbered lists embedded in a single text blob
// and split into individual steps with the leading prefix stripped.
//
// The non-digit predecessor guard (?:^|[^\d]) avoids matching decimals embedded
// in ingredient amounts (e.g. "1.5 cups"); the period+space marker still allows
// HBH-style "set aside.2. Set..." with no whitespace between sentences.
//
// Returns [] when fewer than 2 numbered prefixes are found, signaling the
// caller to keep the original single-step output.
function splitNumberedList(text: string): string[] {
  const re = /(?:^|[^\d])(\d+\.\s+)/g;
  const positions: { start: number; end: number }[] = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const prefixStart = m.index + m[0].length - m[1].length;
    positions.push({ start: prefixStart, end: prefixStart + m[1].length });
  }

  if (positions.length < 2) return [];

  const pieces: string[] = [];
  for (let i = 0; i < positions.length; i++) {
    const sliceStart = positions[i].end;
    const sliceEnd = i + 1 < positions.length ? positions[i + 1].start : text.length;
    const piece = text.slice(sliceStart, sliceEnd).trim();
    if (piece.length > 10) pieces.push(piece);
  }

  return pieces.length >= 2 ? pieces : [];
}

function splitStringInstructions(text: string): { text: string }[] {
  const sentences = stripHtml(text).split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
  return sentences.map((s) => ({ text: s }));
}

function derivePrepItems(steps: { text: string }[]): ParsedPrepItem[] {
  const items: ParsedPrepItem[] = [];

  for (let i = 0; i < Math.min(2, steps.length); i++) {
    const text = steps[i].text;
    const preheatMatch = text.match(/preheat (?:the )?oven to (\d+°?\s*[FC]?)/i);
    if (preheatMatch) {
      items.push({
        label: `Preheat oven to ${preheatMatch[1]}`,
        duration: '20 min',
        defaultChecked: false,
      });
      break;
    }
  }

  return items.slice(0, 4);
}

function parseTools(value: any): ParsedTool[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t) => ({
      name: stripHtml(getString(typeof t === 'string' ? t : t?.name)),
      price: '',
      partner: 'Amazon',
    }))
    .filter((t) => t.name.length > 0)
    .slice(0, 3);
}

function guessTag(node: any): string | null {
  const categories = ([] as string[])
    .concat(node.recipeCategory || [])
    .concat(node.recipeCuisine || [])
    .concat(node.keywords || [])
    .map((c) => (typeof c === 'string' ? c.toLowerCase() : ''))
    .join(' ');

  if (!categories) return null;
  if (/breakfast|brunch/.test(categories)) return 'Breakfast';
  if (/dessert|cake|cookie|sweet|pie/.test(categories)) return 'Dessert';
  if (/side|salad|veg/.test(categories)) return 'Side';
  if (/slow.?cooker|crock.?pot|instant.?pot/.test(categories)) return 'Slow-cooker';
  if (/vegetarian|vegan/.test(categories)) return 'Vegetarian';
  if (/quick|easy|weeknight|30.?minute/.test(categories)) return 'Weeknight';
  return null;
}
