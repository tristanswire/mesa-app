import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  // TODO (Phase 3): gate initial route on first-launch AsyncStorage/MMKV flag.
  // If no "onboarding_complete" flag is set, start at "Onboarding" instead of "Main".
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
    </Stack.Navigator>
  );
}
