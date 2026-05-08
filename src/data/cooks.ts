import { and, count, desc, eq, gte, isNotNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { cooks } from '../db/schema';
import { getCurrentUserId } from './user';

export type Cook = {
  id: string;
  userId: string;
  recipeId: string;
  startedAt: string;
  completedAt: string | null;
  rating: number | null;
  notes: string | null;
};

export async function startCook(recipeId: string): Promise<string> {
  const userId = await getCurrentUserId();
  const cookId = Crypto.randomUUID();

  await db.insert(cooks).values({
    id: cookId,
    userId,
    recipeId,
    startedAt: new Date().toISOString(),
  });

  return cookId;
}

export async function completeCook(cookId: string): Promise<void> {
  await db
    .update(cooks)
    .set({ completedAt: new Date().toISOString() })
    .where(eq(cooks.id, cookId));
}

export async function setCookRating(cookId: string, rating: number | null): Promise<void> {
  await db.update(cooks).set({ rating }).where(eq(cooks.id, cookId));
}

export async function setCookNotes(cookId: string, notes: string): Promise<void> {
  await db
    .update(cooks)
    .set({ notes: notes.trim() || null })
    .where(eq(cooks.id, cookId));
}

export async function getCook(cookId: string): Promise<Cook | null> {
  const result = await db.select().from(cooks).where(eq(cooks.id, cookId)).limit(1);
  return (result[0] as Cook | undefined) ?? null;
}

export async function getCooksForUser(): Promise<Cook[]> {
  const userId = await getCurrentUserId();
  const result = await db
    .select()
    .from(cooks)
    .where(eq(cooks.userId, userId))
    .orderBy(desc(cooks.startedAt));
  return result as Cook[];
}

export type ProfileStats = {
  totalCooks: number;
  uniqueRecipes: number;
  cooksThisWeek: number;
};

// Stats only count completed cooks. An incomplete cook (Cook Mode opened then
// abandoned without reaching PostCook) is still useful as analytics signal but
// shouldn't inflate the user's "you've cooked X recipes" number.
export async function getProfileStats(): Promise<ProfileStats> {
  const userId = await getCurrentUserId();
  const completedFilter = and(eq(cooks.userId, userId), isNotNull(cooks.completedAt));

  const totalRows = await db.select({ count: count() }).from(cooks).where(completedFilter);
  const totalCooks = totalRows[0]?.count ?? 0;

  const uniqueRows = await db
    .selectDistinct({ recipeId: cooks.recipeId })
    .from(cooks)
    .where(completedFilter);
  const uniqueRecipes = uniqueRows.length;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekRows = await db
    .select({ count: count() })
    .from(cooks)
    .where(and(completedFilter, gte(cooks.startedAt, oneWeekAgo)));
  const cooksThisWeek = weekRows[0]?.count ?? 0;

  return { totalCooks, uniqueRecipes, cooksThisWeek };
}
