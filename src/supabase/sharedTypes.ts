// Mirror of supabase/functions/import-recipe/types.ts.
// Kept in sync manually; client-side imports can't reach into the Deno function directory.

export type ParsedRecipe = {
  title: string;
  duration: string;
  servings: number;
  tag: string | null;
  // AI-suggested meal category. Untrusted — caller must run through
  // normalizeCategory() before persisting. May be null/undefined/garbage.
  category?: string | null;
  // Auto-generated descriptive tags: cuisine, attributes, and a computed time
  // bucket. Normalized server-side; older responses may omit the field
  // entirely, so callers must tolerate undefined.
  tags?: string[];
  imageUrl: string | null;
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  prepItems: ParsedPrepItem[];
  tools: ParsedTool[];
};

export type ParsedIngredient = {
  amount: string;
  name: string;
  prep: string | null;
};

export type ParsedStep = {
  segments: ParsedStepSegment[];
  ingredients: { id: string; display: string }[];
  timers: { id: string; label: string; durationSeconds: number }[];
};

export type ParsedStepSegment =
  | { type: 'text'; content: string }
  | { type: 'ingredient'; ingredientId: string }
  | { type: 'timer'; timerId: string };

export type ParsedPrepItem = {
  label: string;
  duration: string | null;
  defaultChecked: boolean;
};

export type ParsedTool = {
  name: string;
  price: string;
  partner: string;
};

export type ImportRequest = {
  url: string;
};

export type ImportResponse =
  | { success: true; recipe: ParsedRecipe }
  | { success: false; error: string };
