import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useOnboardingComplete } from '../data/hooks';
import { colors } from '../theme';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { complete } = useOnboardingComplete();

  // Hold render until the flag resolves — avoids a flash of Main before Onboarding.
  if (complete === null) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  // Both screens stay registered so the Profile debug link can still navigate to
  // Onboarding for preference re-edit. initialRouteName is the gate.
  return (
    <Stack.Navigator
      initialRouteName={complete ? 'Main' : 'Onboarding'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
    </Stack.Navigator>
  );
}
