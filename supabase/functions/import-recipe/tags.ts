/**
 * Auto-tags for imported recipes: a cuisine and a couple of genuinely
 * descriptive attributes from the model, plus a time bucket this module
 * computes itself.
 *
 * Two deliberate exclusions keep tags from duplicating what the recipe already
 * carries. Meal type belongs to the `category` column — it is user-editable and
 * drives its own filter row, so a "dinner" tag beside a "dinner" category is
 * the same fact twice. And the time bucket is derived from `duration` in code:
 * the duration is already known by the time we get here, so asking a model to
 * bucket it spends tokens on arithmetic and invites disagreement with the
 * duration shown right next to it.
 */

/** The model's own tags are capped here; the time bucket is added on top. */
const MAX_MODEL_TAGS = 4;

/** Longer than this is a sentence, not a tag. */
const MAX_TAG_LENGTH = 24;

/** Mirrors RecipeCategory in src/data/recipes.ts — the `category` field's job. */
const CATEGORY_VALUES = new Set([
  'breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'drink', 'side', 'appetizer', 'other',
]);

export const TIME_BUCKET_UNDER_30 = 'under 30 min';
export const TIME_BUCKET_30_TO_60 = '30-60 min';
export const TIME_BUCKET_OVER_HOUR = 'over 1 hr';

/**
 * Total minutes in a duration string: "30 min", "1 hr 20 min", "1 hour",
 * "About 45 minutes". Returns null when nothing parses — an unreadable
 * duration gets no time bucket rather than a guessed one.
 */
export function durationToMinutes(duration: string): number | null {
  if (typeof duration !== 'string') return null;
  const text = duration.toLowerCase();

  let total = 0;
  let matched = false;

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hours) {
    total += parseFloat(hours[1]) * 60;
    matched = true;
  }

  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
  if (minutes) {
    total += parseFloat(minutes[1]);
    matched = true;
  }

  // A bare number is minutes by convention ("45").
  if (!matched) {
    const bare = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (bare) {
      total = parseFloat(bare[1]);
      matched = true;
    }
  }

  return matched && total > 0 ? total : null;
}

/** Time bucket for a duration, or null when the duration doesn't parse. */
export function timeBucket(duration: string): string | null {
  const minutes = durationToMinutes(duration);
  if (minutes === null) return null;
  if (minutes < 30) return TIME_BUCKET_UNDER_30;
  if (minutes <= 60) return TIME_BUCKET_30_TO_60;
  return TIME_BUCKET_OVER_HOUR;
}

/**
 * Coerce untrusted model tags into the stored shape, then append the computed
 * time bucket. Non-strings, blanks, over-long entries, duplicates and meal-type
 * repeats are dropped rather than rejected — a bad tag should cost one tag, not
 * the whole import.
 */
export function normalizeTags(value: unknown, duration: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  const add = (raw: unknown): void => {
    if (typeof raw !== 'string') return;
    const tag = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (CATEGORY_VALUES.has(tag)) return;
    if (seen.has(tag)) return;
    seen.add(tag);
    tags.push(tag);
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      if (tags.length >= MAX_MODEL_TAGS) break;
      add(item);
    }
  }

  const bucket = timeBucket(duration);
  if (bucket && !seen.has(bucket)) tags.push(bucket);

  return tags;
}
