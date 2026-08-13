// Shared between client and Edge Function
export type ParsedRecipe = {
  title: string;
  duration: string;
  servings: number;
  tag: string | null;
  // AI-suggested meal category. Untrusted — caller validates against the
  // allowed set before persisting (see normalizeCategory in src/data/recipes.ts).
  category?: string | null;
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

/**
 * Exactly one mode per request. The handler rejects zero or multiple modes
 * rather than guessing, so a malformed client can't silently get URL behavior.
 */
export type ImportRequest =
  /** Existing behavior — fetch and parse a recipe page. */
  | { url: string }
  /** Photo of a cookbook page or recipe card, parsed by Claude vision. */
  | { imageBase64: string; mediaType: string }
  /** Freeform recipe text, typed or pasted. */
  | { text: string };

/**
 * Media types the photo endpoint recognizes. HEIC is recognized so an iPhone
 * upload gets a specific, actionable error instead of a generic rejection —
 * see VISION_MEDIA_TYPES for what actually reaches the model.
 */
export const PHOTO_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
] as const;

export type PhotoMediaType = (typeof PHOTO_MEDIA_TYPES)[number];

/**
 * What Claude vision actually accepts. HEIC is NOT in this list — the Anthropic
 * API rejects it, so a HEIC image can never be parsed server-side no matter
 * what we do here. iOS shoots HEIC by default, so the client must transcode to
 * JPEG before upload (expo-image-picker: `ImagePicker.UIImagePickerControllerQualityType`
 * / a `manipulateAsync` pass with `SaveFormat.JPEG`).
 */
export const VISION_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type VisionMediaType = (typeof VISION_MEDIA_TYPES)[number];

export type ImportResponse =
  | { success: true; recipe: ParsedRecipe }
  | { success: false; error: string };
