import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  RecipeDetailScreen,
  PrepModeScreen,
  CookModeScreen,
  CookModeLightScreen,
  PostCookScreen,
  ImportScreen,
  ShowcaseScreen,
} from '../screens';
import { TabNavigator } from './TabNavigator';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab root — tab bar visible only inside here */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Pushed full-screen routes — tab bar hidden */}
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="PrepMode" component={PrepModeScreen} />
      <Stack.Screen name="CookMode" component={CookModeScreen} />
      <Stack.Screen name="CookModeLight" component={CookModeLightScreen} />
      <Stack.Screen name="PostCook" component={PostCookScreen} />
      <Stack.Screen name="Showcase" component={ShowcaseScreen} />

      {/* Modal — slides up from bottom, no tab bar */}
      <Stack.Screen
        name="Import"
        component={ImportScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
