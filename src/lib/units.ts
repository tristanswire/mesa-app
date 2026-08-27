// Ingredient-amount unit conversion. Pure, no I/O — given an `amount` string
// (e.g. "2 tbsp", "1/2 cup", "1 1/2 lbs", "200 g") return the equivalent in
// the target measurement system, or pass the input through unchanged when no
// safe conversion applies (unitless, ambiguous, or already in target system).
//
// The ingredient name is never touched by this function. Callers render
// `${convertAmount(ing.amount, system)} ${ing.name}` so the noun phrase
// is preserved exactly per spec.

export type MeasurementSystem = 'imperial' | 'metric';

const CUP_ML = 240;
const FLOZ_ML = 29.5735;
const TBSP_ML = 14.7868;
const TSP_ML = 4.9289;
const OZ_G = 28.3495;
const LB_G = 453.592;

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅐': 1 / 7, '⅑': 1 / 9, '⅒': 0.1,
};

type UnitKind =
  | 'imperial-volume'
  | 'imperial-mass'
  | 'metric-volume'
  | 'metric-mass'
  | 'ambiguous';

type UnitDef = {
  pattern: RegExp;
  kind: UnitKind;
  toMl?: number;
  toG?: number;
};

// Order matters: longer / more-specific patterns first ("fl oz" before "oz",
// "kg" before "g", "tablespoons" matched via tbsps? before "tsps?").
const UNITS: UnitDef[] = [
  // Imperial volume
  { pattern: /^(?:fl\.?\s*oz\.?|fluid\s+ounces?)\b/i, kind: 'imperial-volume', toMl: FLOZ_ML },
  { pattern: /^(?:tablespoons?|tbsps?|tbls?)\b\.?/i, kind: 'imperial-volume', toMl: TBSP_ML },
  { pattern: /^(?:teaspoons?|tsps?)\b\.?/i, kind: 'imperial-volume', toMl: TSP_ML },
  { pattern: /^cups?\b/i, kind: 'imperial-volume', toMl: CUP_ML },
  // Imperial mass
  { pattern: /^(?:lbs?|pounds?)\b\.?/i, kind: 'imperial-mass', toG: LB_G },
  { pattern: /^(?:oz\.?|ounces?)\b/i, kind: 'imperial-mass', toG: OZ_G },
  // Metric volume
  { pattern: /^(?:milliliters?|millilitres?|ml)\b/i, kind: 'metric-volume', toMl: 1 },
  { pattern: /^(?:liters?|litres?|l)\b/i, kind: 'metric-volume', toMl: 1000 },
  // Metric mass — kg before g so the longer match wins
  { pattern: /^(?:kilograms?|kilogrammes?|kg)\b/i, kind: 'metric-mass', toG: 1000 },
  { pattern: /^(?:grams?|grammes?|g)\b/i, kind: 'metric-mass', toG: 1 },
  // Ambiguous — never convert, return as-is
  {
    pattern: /^(?:pinch(?:es)?|dash(?:es)?|handful|splash|sprinkle|to\s+taste)\b/i,
    kind: 'ambiguous',
  },
];

export function convertAmount(amount: string, system: MeasurementSystem): string {
  const raw = (amount ?? '').trim();
  if (!raw) return amount;

  // Temperature shortcut: "425°F" or "200°C" written in the amount field.
  // Rare for ingredients but spec-listed, so handle it inline.
  const tempMatch = raw.match(/^([\d.]+)\s*°?\s*([FC])\b/i);
  if (tempMatch) {
    const value = parseFloat(tempMatch[1]);
    const fromUnit = tempMatch[2].toUpperCase();
    if (fromUnit === 'F' && system === 'metric') {
      return `${Math.round(((value - 32) * 5) / 9)}°C`;
    }
    if (fromUnit === 'C' && system === 'imperial') {
      return `${Math.round((value * 9) / 5 + 32)}°F`;
    }
    return amount;
  }

  const parsed = parseQuantityAndUnit(raw);
  if (!parsed) return amount;

  const { quantity, unit } = parsed;

  if (unit.kind === 'ambiguous') return amount;

  const currentSystem: MeasurementSystem =
    unit.kind === 'imperial-volume' || unit.kind === 'imperial-mass'
      ? 'imperial'
      : 'metric';
  if (currentSystem === system) return amount;

  const dimension: 'volume' | 'mass' =
    unit.kind === 'imperial-volume' || unit.kind === 'metric-volume' ? 'volume' : 'mass';

  if (dimension === 'volume') {
    const ml = quantity * (unit.toMl ?? 0);
    return system === 'metric' ? formatMetricAmount(ml, 'ml') : formatImperialVolume(ml);
  }
  // mass
  const g = quantity * (unit.toG ?? 0);
  return system === 'metric' ? formatMetricAmount(g, 'g') : formatImperialMass(g);
}

type ParsedAmount = {
  quantity: number;
  unit: UnitDef;
  /** The unit token exactly as written, e.g. "cups" — needed to re-pluralize it. */
  unitText: string;
  /** Text after the unit token — the ingredient name, for chip display strings. */
  remainder: string;
};

type ParsedQuantity = {
  quantity: number;
  /** The whitespace between the quantity and what follows; "" when glued. */
  gap: string;
  /** Everything after the quantity, trimmed. */
  rest: string;
};

/**
 * Split off the leading numeric portion (digits, fractions, unicode fractions,
 * decimals, mixed forms like "1 1/2", "1 ½" or "1½"). Whatever follows is
 * returned untouched — it may be a unit, an ingredient name, or nothing.
 *
 * The space in mixed unicode forms is optional so this round-trips its own
 * output: scaleAmount emits "1½ cups", which convertAmount must be able to read
 * back when the two compose.
 */
function parseLeadingQuantity(raw: string): ParsedQuantity | null {
  const qtyMatch = raw.match(
    /^((?:\d+\s+)?(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])(?:\s*[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])?)(\s*)(.*)$/,
  );
  if (!qtyMatch) return null;

  const quantity = parseQuantity(qtyMatch[1].trim());
  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) return null;

  return { quantity, gap: qtyMatch[2], rest: qtyMatch[3].trim() };
}

function parseQuantityAndUnit(raw: string): ParsedAmount | null {
  const parsed = parseLeadingQuantity(raw);
  if (!parsed) return null;
  if (!parsed.rest) return null; // no unit → unitless, pass through

  for (const unit of UNITS) {
    // Every UNITS pattern is anchored with ^, so the match length is exactly
    // the unit token — everything past it is the trailing name.
    const match = parsed.rest.match(unit.pattern);
    if (match) {
      return {
        quantity: parsed.quantity,
        unit,
        unitText: match[0],
        remainder: parsed.rest.slice(match[0].length).trim(),
      };
    }
  }
  return null;
}

/**
 * Convert a leading quantity+unit inside a longer string, preserving whatever
 * follows: "2 tbsp olive oil" → "29.6 ml olive oil".
 *
 * Cook Mode stores ingredient chips as pre-rendered display strings rather than
 * structured amounts (see StepIngredientSchema), so converting them means
 * parsing the text back apart. Anything that doesn't parse — unitless amounts
 * ("2 large eggs"), ambiguous units ("a pinch of salt"), or text that doesn't
 * start with a quantity — is returned byte-for-byte unchanged.
 */
export function convertLeadingAmount(text: string, system: MeasurementSystem): string {
  const raw = (text ?? '').trim();
  if (!raw) return text;

  const parsed = parseQuantityAndUnit(raw);
  if (!parsed) return text;

  const amountOnly = raw.slice(0, raw.length - parsed.remainder.length).trim();
  const converted = convertAmount(amountOnly, system);

  // convertAmount passes through when no conversion applies (already in the
  // target system, ambiguous unit) — returning `text` keeps the original
  // spacing rather than rebuilding an identical string.
  if (converted === amountOnly) return text;

  return parsed.remainder ? `${converted} ${parsed.remainder}` : converted;
}

/**
 * Convert every temperature in a free-text string: "Preheat oven to 425°F" →
 * "Preheat oven to 218°C".
 *
 * Deliberately requires a degree symbol or the word "degrees". A bare trailing
 * letter ("2 C flour") is far more likely to be a cup abbreviation than a
 * Celsius reading, and mangling a prep label is worse than leaving it alone.
 */
export function convertTemperatures(text: string, system: MeasurementSystem): string {
  if (!text) return text;

  return text.replace(
    /(\d+(?:\.\d+)?)\s*(?:°\s*|\s*degrees?\s+)([FC])\b/gi,
    (whole, value: string, unit: string) => {
      const numeric = parseFloat(value);
      if (!Number.isFinite(numeric)) return whole;
      const from = unit.toUpperCase();
      if (from === 'F' && system === 'metric') {
        return `${Math.round(((numeric - 32) * 5) / 9)}°C`;
      }
      if (from === 'C' && system === 'imperial') {
        return `${Math.round((numeric * 9) / 5 + 32)}°F`;
      }
      return whole;
    },
  );
}

function parseQuantity(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;

  // Mixed "1 1/2" or "1 ½"
  const mixedAscii = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedAscii) {
    return parseInt(mixedAscii[1], 10) + parseInt(mixedAscii[2], 10) / parseInt(mixedAscii[3], 10);
  }
  const mixedUni = trimmed.match(/^(\d+)\s*([¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])$/);
  if (mixedUni) {
    return parseInt(mixedUni[1], 10) + (UNICODE_FRACTIONS[mixedUni[2]] ?? 0);
  }
  // ASCII fraction "1/2"
  const frac = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  }
  // Unicode fraction alone "½"
  if (trimmed.length === 1 && UNICODE_FRACTIONS[trimmed] !== undefined) {
    return UNICODE_FRACTIONS[trimmed];
  }
  // Decimal or integer
  const num = parseFloat(trimmed);
  return Number.isFinite(num) ? num : null;
}

// ── Metric formatting ───────────────────────────────────────────────────────
// A conversion is only useful if the number lands somewhere a cook can measure.
// "29.6 ml" is arithmetically right and practically useless — a 30 ml spoon is
// the thing in the drawer. So converted values snap to the measures that
// actually exist, but only when they're close enough that the snap is a
// rounding decision rather than a different quantity.

type MetricUnit = 'ml' | 'l' | 'g' | 'kg';

/** Millilitre measures a cook actually owns: spoons, jugs, cup equivalents. */
const ML_MEASURES: ReadonlyArray<number> = [
  1, 2, 2.5, 5, 7.5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 70, 75, 80, 90,
  100, 120, 125, 150, 175, 200, 225, 240, 250, 300, 350, 400, 450, 500,
  600, 700, 750, 800, 900, 1000,
];

/** How far a value may sit from a measure and still be rounded onto it. */
const ML_TOLERANCE = 0.05;
const GRAM_TOLERANCE = 0.03;

/** Below this, grams are close enough already; snapping just loses precision. */
const GRAM_SNAP_ABOVE = 20;

/**
 * Conversions a cook already knows by heart — the pound family, plus the stick
 * of butter every US recipe is built around. A pound is 454 g in every cookbook
 * ever printed, so rounding it to 455 is arithmetically fine and still reads as
 * a mistake. Matched on a tight ±1 g window rather than a percentage, so a
 * genuinely clean nearby value (455 g, 225 g) is never rewritten into one.
 */
const GRAM_LANDMARKS: ReadonlyArray<number> = [
  113, // ¼ lb — one stick of butter
  227, // ½ lb
  454, // 1 lb
  907, // 2 lb
];
const GRAM_LANDMARK_EPSILON = 1;

/** Nearest measure within its own tolerance, or null when nothing is close. */
function nearestMeasure(
  value: number,
  measures: ReadonlyArray<number>,
  tolerance: number,
): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  for (const measure of measures) {
    const distance = Math.abs(value - measure);
    if (distance <= measure * tolerance && distance < bestDistance) {
      bestDistance = distance;
      best = measure;
    }
  }
  return best;
}

function formatMilliliters(ml: number): string {
  if (ml >= 10) {
    // Already a clean multiple of 5 — 360 ml (1½ cups) is a real measurement,
    // not something to nudge onto 350.
    if (Math.abs(ml - Math.round(ml / 5) * 5) < 1e-6) return String(Math.round(ml));
    const snapped = nearestMeasure(ml, ML_MEASURES, ML_TOLERANCE);
    return String(snapped ?? Math.round(ml));
  }
  const snapped = nearestMeasure(ml, ML_MEASURES, ML_TOLERANCE);
  if (snapped !== null) return trimDecimal(snapped.toFixed(1));
  return trimDecimal(ml.toFixed(1));
}

function formatGrams(g: number): string {
  if (g >= GRAM_SNAP_ABOVE) {
    const landmark = GRAM_LANDMARKS.find(
      (value) => Math.abs(g - value) < GRAM_LANDMARK_EPSILON,
    );
    if (landmark !== undefined) return String(landmark);

    const target = Math.round(g / 5) * 5;
    if (Math.abs(g - target) <= target * GRAM_TOLERANCE) return String(target);
    return String(Math.round(g));
  }
  // Sub-gram amounts keep a decimal so a scaled trace doesn't render as "0 g".
  return g >= 1 ? String(Math.round(g)) : trimDecimal(g.toFixed(1));
}

/**
 * Render a metric quantity with its unit. Litres and kilograms below 1 are
 * promoted to millilitres and grams — "300 g" is how a recipe writes it,
 * "0.3 kg" is how a calculator does.
 */
function formatMetricAmount(value: number, unit: MetricUnit): string {
  switch (unit) {
    case 'l':
      return value < 1
        ? formatMetricAmount(value * 1000, 'ml')
        : `${trimDecimal(value.toFixed(1))} l`;
    case 'kg':
      return value < 1
        ? formatMetricAmount(value * 1000, 'g')
        : `${trimDecimal(value.toFixed(1))} kg`;
    case 'ml':
      return `${formatMilliliters(value)} ml`;
    case 'g':
      return `${formatGrams(value)} g`;
  }
}

function formatImperialVolume(ml: number): string {
  if (ml >= 120) {
    const cups = ml / CUP_ML;
    const label = cups === 1 ? 'cup' : 'cups';
    return `${trimDecimal(cups.toFixed(cups >= 100 ? 0 : 1))} ${label}`;
  }
  if (ml >= 11) {
    return `${trimDecimal((ml / TBSP_ML).toFixed(1))} tbsp`;
  }
  return `${trimDecimal((ml / TSP_ML).toFixed(1))} tsp`;
}

function formatImperialMass(g: number): string {
  if (g >= LB_G) {
    const lbs = g / LB_G;
    return `${trimDecimal(lbs.toFixed(lbs >= 100 ? 0 : 1))} lb`;
  }
  return `${trimDecimal((g / OZ_G).toFixed(1))} oz`;
}

function trimDecimal(s: string): string {
  return s.replace(/\.0$/, '');
}

// ── Recipe scaling ──────────────────────────────────────────────────────────
// Session-only serving scaling. Same shape as the conversion above: parse the
// leading quantity, transform it, re-render, and leave everything else — unit
// spelling aside — byte-for-byte alone. Nothing here touches stored data.

/** Kitchen-friendly fractions, US style. Metric amounts stay decimal. */
const FRACTION_GLYPHS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
];

/** Snap targets for the fractional part: the glyphs above, plus 0 and 1. */
const FRACTION_STEPS: ReadonlyArray<number> = [0, ...FRACTION_GLYPHS.map(([v]) => v), 1];

/** Above this, eighths are noise — "10 oz" beats "9⅝ oz". */
const WHOLE_ONLY_ABOVE = 10;

/**
 * Word-form units get re-pluralized to match the scaled quantity ("1½ cups" ×
 * ½ → "¾ cup"). Abbreviations are deliberately excluded: "tbsp" and "g" read
 * the same at any count, and rewriting "lbs" → "lb" is churn, not clarity.
 */
const PLURALIZABLE_UNIT =
  /^(cup|tablespoon|teaspoon|pound|ounce|gram|gramme|kilogram|kilogramme|milliliter|millilitre|liter|litre|fluid\s+ounce)s?(\.?)$/i;

/**
 * Round a scaled quantity to a value a cook can actually measure: whole
 * numbers above 10, otherwise the nearest eighth/third/quarter. A positive
 * quantity never rounds to zero — it floors at ⅛ — because dropping an
 * ingredient entirely is a worse error than over-measuring a trace amount.
 */
function snapQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return value;

  if (value >= WHOLE_ONLY_ABOVE) return Math.max(1, Math.round(value));

  const whole = Math.floor(value + 1e-9);
  const frac = value - whole;

  let best = FRACTION_STEPS[0];
  let bestDistance = Infinity;
  for (const step of FRACTION_STEPS) {
    const distance = Math.abs(frac - step);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = step;
    }
  }

  const snapped = whole + best;
  return snapped > 0 ? snapped : FRACTION_GLYPHS[0][0];
}

/**
 * Render a quantity the way a recipe would write it: "1½", "¾", "3".
 * Used for scaled ingredient amounts and for the servings count itself.
 */
export function formatQuantity(value: number): string {
  const snapped = snapQuantity(value);
  if (!Number.isFinite(snapped) || snapped <= 0) return '0';

  const whole = Math.floor(snapped + 1e-9);
  const frac = snapped - whole;
  const glyph = FRACTION_GLYPHS.find(([v]) => Math.abs(v - frac) < 1e-6)?.[1];

  if (!glyph) return String(whole);
  return whole > 0 ? `${whole}${glyph}` : glyph;
}

function adjustUnitPlural(unitText: string, quantity: number): string {
  const match = unitText.match(PLURALIZABLE_UNIT);
  if (!match) return unitText;
  return `${match[1]}${quantity > 1 ? 's' : ''}${match[2]}`;
}

/**
 * Scale the leading amount in `text` by `factor`, preserving whatever follows:
 * "1½ cups sugar" × ½ → "¾ cup sugar". US and unitless amounts render as
 * cooking fractions; metric amounts go through formatMetricAmount, the same
 * formatter convertAmount uses, so the two compose (scale first, then convert).
 *
 * Passed through byte-for-byte when scaling would be wrong or unsafe:
 *   - factor of 1 (nothing to do)
 *   - ranges and dimensions — "2-3 tbsp", "2 to 3 cups", "9x13 pan" — where
 *     rewriting one end produces nonsense
 *   - ambiguous measures ("1 pinch cayenne"); half a pinch isn't a thing
 *   - temperatures written in an amount slot ("425°F")
 *   - text with no leading quantity at all
 *
 * The trailing noun is never re-pluralized — "2 large eggs" × ½ reads
 * "1 large eggs" — the same deliberate hands-off treatment of the ingredient
 * name that convertAmount applies.
 */
export function scaleAmount(text: string, factor: number): string {
  const raw = (text ?? '').trim();
  if (!raw) return text;
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return text;

  // A temperature in an amount slot is a setting, not a quantity.
  if (/^\d+(?:\.\d+)?\s*(?:°|degrees?\b)/i.test(raw)) return text;

  const parsed = parseLeadingQuantity(raw);
  if (!parsed) return text;

  // Ranges ("2-3 tbsp", "2 to 3 cups") and pan dimensions ("9x13") start with a
  // number but aren't a single scalable quantity.
  if (/^(?:[-–—x×]|to\s+\d|or\s+\d)/i.test(parsed.rest)) return text;

  const unit = parsed.rest ? UNITS.find((u) => u.pattern.test(parsed.rest)) : undefined;
  if (unit?.kind === 'ambiguous') return text;

  // No recognized unit: only scale when the number reads as a standalone count
  // ("2 large eggs", or a bare "2"). A digit glued to what follows, or followed
  // by another number, is some other notation we shouldn't rewrite.
  if (!unit && parsed.rest && (parsed.gap === '' || /^\d/.test(parsed.rest))) return text;

  const scaled = parsed.quantity * factor;

  if (!unit) {
    const quantityOut = formatQuantity(scaled);
    return parsed.rest ? `${quantityOut} ${parsed.rest}` : quantityOut;
  }

  const unitText = parsed.rest.match(unit.pattern)![0];
  // Slice rather than trim so the ingredient name keeps its original spacing.
  const tail = parsed.rest.slice(unitText.length);

  // Metric re-renders through the shared formatter, which owns the unit as well
  // as the number — a scaled-down kilogram becomes "333 g", not "0.3 kg".
  const metricUnit = toMetricUnit(unit);
  if (metricUnit) return `${formatMetricAmount(scaled, metricUnit)}${tail}`;

  return `${formatQuantity(scaled)} ${adjustUnitPlural(unitText, snapQuantity(scaled))}${tail}`;
}

function toMetricUnit(unit: UnitDef): MetricUnit | null {
  if (unit.kind === 'metric-volume') return unit.toMl === 1000 ? 'l' : 'ml';
  if (unit.kind === 'metric-mass') return unit.toG === 1000 ? 'kg' : 'g';
  return null;
}

// ── Inline amounts in prose ─────────────────────────────────────────────────
// Cook Mode renders a step as chips plus free text. The chips convert, so the
// prose has to as well — a chip reading "30 ml olive oil" beside a sentence
// saying "two tablespoons" is worse than not converting at all.
//
// This scanner is deliberately narrower than the amount parser above. It only
// fires on unambiguous unit words, and it refuses anything with range or
// dimension context around it. A missed conversion is invisible; a mangled
// sentence is not.

/**
 * Unit tokens safe to recognize mid-sentence. Single-letter cooking
 * abbreviations (C, T, t) are excluded on purpose — "2 C flour" is a cup far
 * more often than 2 Celsius, and there is no way to tell from the text.
 * Trailing periods are never consumed, so "1 tsp." keeps its full stop.
 */
const INLINE_UNITS = [
  'tablespoons?', 'tbsps?', 'tbls?',
  'teaspoons?', 'tsps?',
  'cups?',
  'fl\\s*oz', 'fluid\\s+ounces?',
  'pounds?', 'lbs?',
  'ounces?', 'oz',
  'kilograms?', 'kilogrammes?', 'kg',
  'grams?', 'grammes?', 'g',
  'milliliters?', 'millilitres?', 'ml',
  'liters?', 'litres?', 'l',
].join('|');

/** Longest forms first so "1 1/2" wins over "1", and "1½" over "1". */
const INLINE_QUANTITY = [
  '\\d+\\s+\\d+\\s*/\\s*\\d+',
  '\\d+\\s*[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞]',
  '\\d+\\s*/\\s*\\d+',
  '\\d+(?:\\.\\d+)?',
  '[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞]',
].join('|');

// No capture groups: the replace callback receives (match, offset, source).
// String.replace resets lastIndex on every call, so sharing one instance is safe.
const INLINE_AMOUNT = new RegExp(`(?:${INLINE_QUANTITY})\\s*(?:${INLINE_UNITS})\\b`, 'gi');

/**
 * Reject matches whose surroundings say this isn't a standalone quantity:
 * ranges ("2-3 tablespoons", "2 to 3 cups"), dimensions ("9 x 13"), or a number
 * glued to the token before it.
 */
function isStandaloneInlineAmount(before: string, after: string): boolean {
  if (/[\w.,/]$/.test(before)) return false;
  if (/[-–—x×]\s*$/i.test(before)) return false;
  if (/\b(?:to|or)\s+$/i.test(before)) return false;
  if (/^\s*(?:[-–—]|to\s+\d|or\s+\d)/i.test(after)) return false;
  return true;
}

function replaceInlineAmounts(text: string, transform: (amount: string) => string): string {
  return text.replace(INLINE_AMOUNT, (match: string, ...rest: unknown[]) => {
    const offset = rest[rest.length - 2] as number;
    if (!isStandaloneInlineAmount(text.slice(0, offset), text.slice(offset + match.length))) {
      return match;
    }
    return transform(match);
  });
}

/**
 * Convert every unambiguous quantity+unit in a sentence, plus any temperatures:
 * "Whisk in 2 tablespoons olive oil" → "Whisk in 30 ml olive oil".
 *
 * Everything the scanner can't vouch for is left exactly as written — ranges,
 * bare single-letter units, amounts already in the target system, and any text
 * with no recognizable measure in it.
 */
export function convertInlineAmounts(text: string, system: MeasurementSystem): string {
  if (!text) return text;
  const converted = replaceInlineAmounts(text, (amount) => convertAmount(amount, system));
  return convertTemperatures(converted, system);
}

/**
 * Scale every unambiguous quantity+unit in a sentence by `factor`, using the
 * same guards as convertInlineAmounts. Runs before conversion — scaleAmount
 * emits cooking fractions that convertAmount can read back, not the reverse.
 */
export function scaleInlineAmounts(text: string, factor: number): string {
  if (!text || factor === 1) return text;
  return replaceInlineAmounts(text, (amount) => scaleAmount(amount, factor));
}
