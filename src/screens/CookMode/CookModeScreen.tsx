import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { useColorScheme } from 'react-native';
import type { MainStackParamList } from '../../navigation/types';
import { CookModeView, type CookModeTheme } from './CookModeView';

type Route = RouteProp<MainStackParamList, 'CookMode'>;

export function CookModeScreen() {
  const route = useRoute<Route>();
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [override, setOverride] = useState<CookModeTheme | null>(null);

  // Effective theme: per-session override beats system appearance.
  // Default to dark when iOS hasn't resolved yet (matches Mesa's branded look).
  const theme: CookModeTheme = override ?? (systemScheme === 'light' ? 'light' : 'dark');

  return (
    <CookModeView
      recipeId={route.params.recipeId}
      initialStepIndex={route.params.stepIndex}
      theme={theme}
      onToggleTheme={() => setOverride(theme === 'dark' ? 'light' : 'dark')}
    />
  );
}
