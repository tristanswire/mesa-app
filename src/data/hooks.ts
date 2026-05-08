import { and, count, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/client';
import { cooks, recipes } from '../db/schema';
import {
  getUserPreferences,
  hasCompletedOnboarding,
  type UserPreferences,
} from './preferences';
import { getRecipe, type RecipeDetail, type RecipeListItem } from './recipes';
import { getCurrentUserId } from './user';

// Sentinel that matches no real recipe — used while the current userId is loading
// from AsyncStorage. Once it resolves, the deps array re-subscribes the live query.
const NO_USER = '__no_user__';

export function useRecipesList() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getCurrentUserId().then(setUserId).catch(() => setUserId(null));
  }, []);

  const query = db
    .select({
      id: recipes.id,
      title: recipes.title,
      duration: recipes.duration,
      tag: recipes.tag,
      tintKey: recipes.tintKey,
      imageUrl: recipes.imageUrl,
    })
    .from(recipes)
    .where(eq(recipes.userId, userId ?? NO_USER))
    .orderBy(desc(recipes.updatedAt));

  const { data } = useLiveQuery(query, [userId]);

  return {
    data: (data ?? []) as RecipeListItem[],
    ready: userId !== null && data !== undefined,
  };
}

export function useRecipeDetail(id: string | undefined) {
  const [data, setData] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getRecipe(id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}

type HomeData = {
  lastCooked: RecipeListItem | null;
  inYourBank: RecipeListItem[];
  worthATry: RecipeListItem[];
  ready: boolean;
};

export function useHomeData(): HomeData {
  const { data, ready } = useRecipesList();

  if (!ready) {
    return { lastCooked: null, inYourBank: [], worthATry: [], ready: false };
  }

  return {
    lastCooked: data[0] ?? null,
    inYourBank: data.slice(0, 2),
    worthATry: data.slice(2, 5),
    ready: true,
  };
}

// Reactive Profile stats. Recomputes whenever any row in the cooks table changes
// (drizzle-orm's useLiveQuery wraps a SQLite update listener). Only counts cooks
// with completedAt set — see cooks.ts getProfileStats for the same rule.
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function useProfileStats() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getCurrentUserId().then(setUserId).catch(() => setUserId(null));
  }, []);

  const effectiveUserId = userId ?? NO_USER;
  const completedFilter = and(eq(cooks.userId, effectiveUserId), isNotNull(cooks.completedAt));
  const oneWeekAgo = new Date(Date.now() - ONE_WEEK_MS).toISOString();

  const totalQuery = db.select({ count: count() }).from(cooks).where(completedFilter);
  const uniqueQuery = db.selectDistinct({ recipeId: cooks.recipeId }).from(cooks).where(completedFilter);
  const weekQuery = db
    .select({ count: count() })
    .from(cooks)
    .where(and(completedFilter, gte(cooks.startedAt, oneWeekAgo)));

  const { data: totalData } = useLiveQuery(totalQuery, [userId]);
  const { data: uniqueData } = useLiveQuery(uniqueQuery, [userId]);
  const { data: weekData } = useLiveQuery(weekQuery, [userId]);

  return {
    totalCooks: totalData?.[0]?.count ?? 0,
    uniqueRecipes: uniqueData?.length ?? 0,
    cooksThisWeek: weekData?.[0]?.count ?? 0,
    ready: userId !== null,
  };
}

// Preferences change rarely. Skip useLiveQuery — Profile re-fetches on focus
// when navigating back from an edit screen (see ProfileScreen useFocusEffect).
export function useUserPreferences() {
  const [data, setData] = useState<UserPreferences | null>(null);

  const refresh = useCallback(() => {
    getUserPreferences()
      .then(setData)
      .catch((err) => console.error('[useUserPreferences] read failed', err));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}

// `complete === null` means we're still loading the flag — gate routing on this.
export function useOnboardingComplete() {
  const [complete, setComplete] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    hasCompletedOnboarding()
      .then(setComplete)
      .catch((err) => {
        console.error('[useOnboardingComplete] read failed', err);
        setComplete(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { complete, refresh };
}
