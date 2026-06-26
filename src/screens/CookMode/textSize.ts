import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography } from '../../theme';

// Cook Mode's in-app step-text scale. Separate from iOS Dynamic Type (which
// stays enabled app-wide) — this is an additional Cook-Mode-only override on the
// step INSTRUCTION text. The step number and ingredient/timer chips do NOT scale.
export type CookTextSize = 'M' | 'L' | 'XL';

export const COOK_TEXT_SIZE_ORDER: CookTextSize[] = ['M', 'L', 'XL'];

export const COOK_TEXT_SIZE_LABELS: Record<CookTextSize, string> = {
  M: 'Medium',
  L: 'Large',
  XL: 'Extra Large',
};

type CookTextScale = { fontSize: number; lineHeight: number; columnGap: number };

// M mirrors the cookModeBody token exactly, so the default ('M') is a no-op and
// the established Cook Mode minimum (cookModeBody.fontSize) is never undercut.
// L / XL step up 6pt each, keeping the ~1.5 line-height ratio. columnGap (the
// inter-word space in the flex-wrap layout) scales with size so words don't
// crowd at XL.
const BASE_SIZE = typography.cookModeBody.fontSize;
const BASE_LINE = typography.cookModeBody.lineHeight ?? Math.round(BASE_SIZE * 1.5);

export const COOK_TEXT_SCALE: Record<CookTextSize, CookTextScale> = {
  M: { fontSize: BASE_SIZE, lineHeight: BASE_LINE, columnGap: 5 },
  L: { fontSize: BASE_SIZE + 6, lineHeight: BASE_LINE + 8, columnGap: 6 },
  XL: { fontSize: BASE_SIZE + 12, lineHeight: BASE_LINE + 16, columnGap: 8 },
};

// Bounds how far Dynamic Type can scale the (already slider-scaled) step text,
// so XL + max accessibility setting can't compound into a layout-breaking size.
// The step content lives in a ScrollView, so anything past this just scrolls.
export const COOK_TEXT_MAX_FONT_MULTIPLIER = 1.4;

const STORAGE_KEY = 'mesa.cookmode.textSize';

function isCookTextSize(value: unknown): value is CookTextSize {
  return value === 'M' || value === 'L' || value === 'XL';
}

// Persisted locally so a user who needs XL gets it every session. Defaults to M
// on any read failure or first run.
export async function loadCookTextSize(): Promise<CookTextSize> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isCookTextSize(stored) ? stored : 'M';
  } catch (e) {
    console.error('[cookmode] failed to load text size', e);
    return 'M';
  }
}

export async function saveCookTextSize(size: CookTextSize): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, size);
  } catch (e) {
    console.error('[cookmode] failed to save text size', e);
  }
}
