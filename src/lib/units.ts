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
    return system === 'metric' ? `${formatMetric(ml)} ml` : formatImperialVolume(ml);
  }
  // mass
  const g = quantity * (unit.toG ?? 0);
  return system === 'metric' ? `${formatMetric(g)} g` : formatImperialMass(g);
}

type ParsedAmount = {
  quantity: number;
  unit: UnitDef;
  /** Text after the unit token — the ingredient name, for chip display strings. */
  remainder: string;
};

function parseQuantityAndUnit(raw: string): ParsedAmount | null {
  // Split off the leading numeric portion (digits, fractions, unicode fractions,
  // decimals, mixed forms like "1 1/2" or "1 ½"). The unit is whatever follows.
  const qtyMatch = raw.match(
    /^((?:\d+\s+)?(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])(?:\s+[¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])?)\s*(.*)$/,
  );
  if (!qtyMatch) return null;

  const qtyStr = qtyMatch[1].trim();
  const rest = qtyMatch[2].trim();
  const quantity = parseQuantity(qtyStr);
  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) return null;

  if (!rest) return null; // no unit → unitless, pass through

  for (const unit of UNITS) {
    // Every UNITS pattern is anchored with ^, so the match length is exactly
    // the unit token — everything past it is the trailing name.
    const match = rest.match(unit.pattern);
    if (match) {
      return { quantity, unit, remainder: rest.slice(match[0].length).trim() };
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
  const mixedUni = trimmed.match(/^(\d+)\s+([¼½¾⅐-⅒⅓⅔⅛⅜⅝⅞])$/);
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

// Round per spec: ≥100 → whole, otherwise 1 decimal (trailing .0 trimmed).
function formatMetric(value: number): string {
  if (value >= 100) return Math.round(value).toString();
  return trimDecimal(value.toFixed(1));
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
