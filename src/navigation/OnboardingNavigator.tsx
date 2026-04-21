import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ValuePropScreen, AhaMomentScreen, PreferencesScreen } from '../screens';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, statusBarStyle: 'dark' }}>
      <Stack.Screen name="ValueProp" component={ValuePropScreen} />
      <Stack.Screen name="AhaMoment" component={AhaMomentScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}
