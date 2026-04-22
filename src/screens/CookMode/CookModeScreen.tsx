import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import React from 'react';
import type { MainStackParamList } from '../../navigation/types';
import { CookModeView } from './CookModeView';

type Route = RouteProp<MainStackParamList, 'CookMode'>;

export function CookModeScreen() {
  const route = useRoute<Route>();
  return (
    <CookModeView
      recipeId={route.params.recipeId}
      initialStepIndex={route.params.stepIndex}
      theme="dark"
    />
  );
}
