import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { userPreferences } from '../db/schema';
import { getCurrentUserId } from './user';

export type CookingFrequency = '1-2x' | '3-5x' | 'every-day';
export type SkillLevel = 'weeknight' | 'enthusiast' | 'pro';

export type UserPreferences = {
  cookingFrequency: CookingFrequency | null;
  dietaryPreferences: string[];
  skillLevel: SkillLevel | null;
  defaultServingSize: number;
  hasCompletedOnboarding: boolean;
  timerSoundEnabled: boolean;
  showRatingPrompt: boolean;
};

export type OnboardingResult = {
  cookingFrequency: CookingFrequency;
  dietaryPreferences: string[];
  skillLevel: SkillLevel;
};

export async function getUserPreferences(): Promise<UserPreferences> {
  const userId = await getCurrentUserId();
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return {
      cookingFrequency: null,
      dietaryPreferences: [],
      skillLevel: null,
      defaultServingSize: 4,
      hasCompletedOnboarding: false,
      timerSoundEnabled: true,
      showRatingPrompt: true,
    };
  }

  const row = result[0];
  return {
    cookingFrequency: (row.cookingFrequency as CookingFrequency | null) ?? null,
    dietaryPreferences: parseDietaryPreferences(row.dietaryPreferences),
    skillLevel: (row.skillLevel as SkillLevel | null) ?? null,
    defaultServingSize: row.defaultServingSize ?? 4,
    hasCompletedOnboarding: row.hasCompletedOnboarding ?? false,
    timerSoundEnabled: row.timerSoundEnabled ?? true,
    showRatingPrompt: row.showRatingPrompt ?? true,
  };
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const prefs = await getUserPreferences();
  return prefs.hasCompletedOnboarding;
}

export async function completeOnboarding(result: OnboardingResult): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({
      cookingFrequency: result.cookingFrequency,
      dietaryPreferences: JSON.stringify(result.dietaryPreferences),
      skillLevel: result.skillLevel,
      hasCompletedOnboarding: true,
    })
    .where(eq(userPreferences.userId, userId));
}

export async function setTimerSoundEnabled(enabled: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ timerSoundEnabled: enabled })
    .where(eq(userPreferences.userId, userId));
}

export async function setShowRatingPrompt(enabled: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ showRatingPrompt: enabled })
    .where(eq(userPreferences.userId, userId));
}

export async function setCookingFrequency(value: CookingFrequency): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ cookingFrequency: value })
    .where(eq(userPreferences.userId, userId));
}

export async function setDietaryPreferences(values: string[]): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ dietaryPreferences: JSON.stringify(values) })
    .where(eq(userPreferences.userId, userId));
}

export async function setSkillLevel(value: SkillLevel): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ skillLevel: value })
    .where(eq(userPreferences.userId, userId));
}

export async function setDefaultServingSize(value: number): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ defaultServingSize: value })
    .where(eq(userPreferences.userId, userId));
}

function parseDietaryPreferences(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
