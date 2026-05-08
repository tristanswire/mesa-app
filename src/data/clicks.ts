import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { clicks } from '../db/schema';
import { getCurrentUserId } from './user';

export type ClickSource = 'recipe_detail' | 'prep_mode' | 'post_cook';

export type RecordClickInput = {
  toolId: string;
  recipeId: string;
  partner: string;
  source: ClickSource;
};

// Fire-and-forget. A tracking failure must NEVER block the linkout — Mesa's job
// is to be helpful, not to gate user actions on telemetry.
export async function recordClick(input: RecordClickInput): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    await db.insert(clicks).values({
      id: Crypto.randomUUID(),
      userId,
      toolId: input.toolId,
      recipeId: input.recipeId,
      partner: input.partner,
      source: input.source,
    });
  } catch (e) {
    console.error('[clicks] record failed:', e);
  }
}
