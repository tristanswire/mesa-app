// Pure (no app imports) so the Deno tests in __tests__ can load it directly.
// Meal categories this file maps onto; a subset of data/recipes RecipeCategory.
type MealCategory = 'breakfast' | 'dinner' | 'dessert' | 'side';

/** The recipe fields the filters read — structurally a RecipeListItem. */
export type BankFilterRecipe = {
  id: string;
  duration: string;
  tag: string | null;
  category: string | null;
};

/**
 * Shortcut filters Home links into Recipes with (the header chips and the
 * "Your bank" tiles). One definition here so a Home count always equals the
 * number of recipes the Recipes screen shows after the tap.
 *
 * Meal-type keys map straight onto the user-assignable `category`; the rest
 * are derived — cook time from `duration`, "Weeknight" from the legacy
 * single `tag` or an auto-tag, "Never cooked" from completed cook history.
 */
export type BankFilterKey =
  | 'breakfast'
  | 'dinner'
  | 'dessert'
  | 'sides'
  | 'under30'
  | 'weeknight'
  | 'neverCooked';

export const BANK_FILTER_LABELS: Record<BankFilterKey, string> = {
  breakfast: 'Breakfast',
  dinner: 'Dinner',
  dessert: 'Dessert',
  sides: 'Sides',
  under30: 'Under 30 min',
  weeknight: 'Weeknight',
  neverCooked: 'Never cooked',
};

/** Keys that are just a category — Recipes shows these on its category pill row. */
export const BANK_FILTER_CATEGORY: Partial<Record<BankFilterKey, MealCategory>> = {
  breakfast: 'breakfast',
  dinner: 'dinner',
  dessert: 'dessert',
  sides: 'side',
};

/**
 * Keys with no category behind them. Recipes shows these as their own pills in
 * the category row, toggled independently of (and ANDed with) the category.
 */
export const BANK_SHORTCUT_FILTERS: readonly BankFilterKey[] = [
  'under30',
  'weeknight',
  'neverCooked',
];

const UNDER_30_MAX_MINUTES = 30;

/**
 * Minutes in an import-style duration ("30 min", "1 hr 20 min", "1 hour",
 * "45 minutes"). Null when nothing parses, so an unknown time is never counted
 * as quick.
 */
export function parseDurationMinutes(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const text = duration.toLowerCase();
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  const minutes = text.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/);
  if (!hours && !minutes) return null;
  return Math.round((hours ? parseFloat(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1], 10) : 0));
}

export type BankFilterContext = {
  /** Auto-tags for the recipe (useRecipeTagIndex). */
  tags: readonly string[];
  /** Recipe ids with at least one completed cook (useCookedRecipeIds). */
  cookedIds: ReadonlySet<string>;
};

export function matchesBankFilter(
  key: BankFilterKey,
  recipe: BankFilterRecipe,
  ctx: BankFilterContext,
): boolean {
  const category = BANK_FILTER_CATEGORY[key];
  if (category) return recipe.category === category;
  switch (key) {
    case 'under30': {
      const minutes = parseDurationMinutes(recipe.duration);
      return minutes !== null && minutes <= UNDER_30_MAX_MINUTES;
    }
    case 'weeknight':
      return (
        recipe.tag?.toLowerCase() === 'weeknight' ||
        ctx.tags.some((t) => t.toLowerCase() === 'weeknight')
      );
    case 'neverCooked':
      return !ctx.cookedIds.has(recipe.id);
    default:
      return false;
  }
}
