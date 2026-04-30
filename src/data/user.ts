import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { db } from '../db/client';
import { userPreferences, users } from '../db/schema';

const GUEST_ID_KEY = 'mesa.guest_user_id';

export async function ensureGuestUser(): Promise<string> {
  let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = Crypto.randomUUID();
    await AsyncStorage.setItem(GUEST_ID_KEY, guestId);

    await db.insert(users).values({
      id: guestId,
      isGuest: true,
    });

    await db.insert(userPreferences).values({
      userId: guestId,
    });
  } else {
    const existing = await db.select().from(users).where(eq(users.id, guestId)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({ id: guestId, isGuest: true });
      await db.insert(userPreferences).values({ userId: guestId });
    }
  }

  return guestId;
}

export async function getCurrentUserId(): Promise<string> {
  const guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (!guestId) throw new Error('No guest user — call ensureGuestUser first');
  return guestId;
}
