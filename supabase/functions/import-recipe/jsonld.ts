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
    prepItems: derivePrepItems(plainSteps, ingredients),
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

// Past-tense knife verbs as written in ingredient.prep ("garlic, minced")
// mapped to the imperative form used for prep-task labels ("Mince garlic").
// Order matters when verbs share a prefix — match longest first by sorting
// keys descending by length at the use site, not here.
const KNIFE_VERB_PAST: Record<string, string> = {
  diced: 'Dice', minced: 'Mince', chopped: 'Chop', sliced: 'Slice',
  halved: 'Halve', quartered: 'Quarter', crushed: 'Crush', smashed: 'Smash',
  grated: 'Grate', shredded: 'Shred', zested: 'Zest', peeled: 'Peel',
  trimmed: 'Trim', cored: 'Core', seeded: 'Seed', deveined: 'Devein',
  butterflied: 'Butterfly', pounded: 'Pound', scored: 'Score', cubed: 'Cube',
  // "cut" is its own past participle ("cut into wedges").
  cut: 'Cut',
};
const KNIFE_VERBS_PAST_KEYS = Object.keys(KNIFE_VERB_PAST).sort((a, b) => b.length - a.length);

// Imperative form for step-text scanning. "cut" is its own imperative.
const KNIFE_VERBS_IMPER = [
  'dice', 'chop', 'mince', 'slice', 'cut', 'halve', 'quarter', 'crush',
  'smash', 'grate', 'shred', 'zest', 'peel', 'trim', 'core', 'seed',
  'devein', 'butterfly', 'pound', 'score', 'cube',
];

const MODIFIER_PREFIX = /^(finely|coarsely|roughly|thinly|thickly|freshly|lightly)\s+/;

// Prep-only knife-work scan: any verb that operates on raw ingredients before
// heat is applied. Strategy is rule-based and conservative — favor false
// negatives over false positives so the surfaced prep list stays trustworthy.
// Three signal sources, in order of confidence:
//   1) Preheat instructions (regex; oven/grill/broiler)
//   2) ingredient.prep field ("garlic, minced") — already structured
//   3) Step-text verb scan, restricted to sentence-initial imperatives so
//      mid-cook actions ("add chopped parsley") don't fire
function derivePrepItems(
  steps: { text: string }[],
  ingredients: ParsedIngredient[],
): ParsedPrepItem[] {
  const items: ParsedPrepItem[] = [];
  const seen = new Set<string>();

  const add = (label: string, duration: string | null = null) => {
    const key = label.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push({ label, duration, defaultChecked: false });
  };

  // 1) Preheat (oven, grill, broiler) — any step, not just first 2
  for (const step of steps) {
    const m = step.text.match(/preheat (?:the |your )?(oven|grill|broiler) to (\d+°?\s*[FC]?)/i);
    if (m) {
      const device = m[1].toLowerCase();
      const temp = m[2].trim();
      add(`Preheat ${device} to ${temp}`, '15 min');
    }
  }

  // 2) ingredient.prep → knife task. "1/4 cup butter, room temperature" gives
  // a temperature-prep task instead of a knife task.
  for (const ing of ingredients) {
    const task = ingredientPrepToTask(ing.name, ing.prep);
    if (task) add(task);
  }

  // 3) Step-text scan for room temp / soften / knife work in sentence-initial
  // position. Limited to the first 3 steps where pre-cook prep typically sits.
  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const text = steps[i].text;

    // "Bring X to room temperature"
    const rt = text.match(/\bbring (?:the )?([\w\s]{2,30}?) to room temperature/i);
    if (rt) add(`Bring ${rt[1].trim().toLowerCase()} to room temp`);

    // "Soften/Melt the butter" — strictly butter to keep noise low
    const soft = text.match(/\b(soften|melt) (?:the )?butter\b/i);
    if (soft) add(`${cap(soft[1])} butter`);

    extractKnifeWorkFromStep(text).forEach((t) => add(t));
  }

  return items.slice(0, 8);
}

function ingredientPrepToTask(name: string, prep: string | null): string | null {
  if (!prep) return null;
  const p = prep.toLowerCase().trim();
  if (!p) return null;

  // Temperature prep — written as "room temperature" or "at room temperature"
  if (/\broom\s+temperature\b/.test(p)) {
    return `Bring ${name} to room temp`;
  }

  // Strip leading modifier ("finely chopped" → "chopped")
  const stripped = p.replace(MODIFIER_PREFIX, '');

  for (const past of KNIFE_VERBS_PAST_KEYS) {
    if (stripped.startsWith(past)) {
      return `${KNIFE_VERB_PAST[past]} ${name}`;
    }
  }
  return null;
}

function extractKnifeWorkFromStep(text: string): string[] {
  const out: string[] = [];
  const verbsAlt = KNIFE_VERBS_IMPER.join('|');
  // Match at sentence start: optional leading "Then "/"Next "/"Now ", then
  // the verb, then an optional article/quantity, then capture the object up
  // to a clause break or "and set aside".
  const re = new RegExp(
    `(?:^|[.!?]\\s+)(?:then\\s+|next\\s+|now\\s+|first\\s+)?(${verbsAlt})\\s+(?:the\\s+|a\\s+|all\\s+(?:of\\s+)?the\\s+|\\d+(?:\\s+\\w+)?\\s+|of\\s+the\\s+|some\\s+|your\\s+)?([a-zA-Z][a-zA-Z\\- ]{1,40}?)(?:\\s+and\\s+set\\s+aside|\\s+into\\s+|\\s*[,.;]|\\s+with\\s+|$)`,
    'gi',
  );
  let m;
  while ((m = re.exec(text)) !== null) {
    const verb = m[1].toLowerCase();
    const obj = m[2].toLowerCase().trim().replace(/\s+/g, ' ');
    if (!obj || obj === 'them' || obj === 'it' || obj === 'up') continue;
    out.push(`${cap(verb)} ${obj}`);
  }
  return out;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
