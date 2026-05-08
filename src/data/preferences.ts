import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { userPreferences } from '../db/schema';
import { getCurrentUserId } from './user';

export type UserPreferences = {
  timerSoundEnabled: boolean;
};

export async function getUserPreferences(): Promise<UserPreferences> {
  const userId = await getCurrentUserId();
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return { timerSoundEnabled: true };
  }

  return {
    timerSoundEnabled: result[0].timerSoundEnabled ?? true,
  };
}

export async function setTimerSoundEnabled(enabled: boolean): Promise<void> {
  const userId = await getCurrentUserId();
  await db
    .update(userPreferences)
    .set({ timerSoundEnabled: enabled })
    .where(eq(userPreferences.userId, userId));
}
