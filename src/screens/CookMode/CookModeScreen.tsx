import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { startCook } from '../../data/cooks';
import type { MainStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { CookModeView, type CookModeTheme } from './CookModeView';

type Route = RouteProp<MainStackParamList, 'CookMode'>;

export function CookModeScreen() {
  const route = useRoute<Route>();
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<CookModeTheme | null>(null);
  const [cookId, setCookId] = useState<string | null>(null);

  // A cook record is created when this screen mounts — matches the user's intent
  // ("I'm cooking this now"). Incomplete cooks are tracked separately from the
  // Profile completed-cook stats; see src/data/cooks.ts.
  useEffect(() => {
    let cancelled = false;
    startCook(route.params.recipeId)
      .then((id) => {
        if (!cancelled) setCookId(id);
      })
      .catch((e) => console.error('[cookmode] failed to start cook record', e));
    return () => {
      cancelled = true;
    };
  }, [route.params.recipeId]);

  const theme: CookModeTheme = override ?? (systemScheme === 'light' ? 'light' : 'dark');

  if (!cookId) {
    return <View style={{ flex: 1, backgroundColor: theme === 'dark' ? colors.pine : colors.cream }} />;
  }

  return (
    <CookModeView
      recipeId={route.params.recipeId}
      initialStepIndex={route.params.stepIndex}
      theme={theme}
      cookId={cookId}
      onToggleTheme={() => setOverride(theme === 'dark' ? 'light' : 'dark')}
    />
  );
}
