import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { db } from '../db/client';
import { recipes } from '../db/schema';
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
