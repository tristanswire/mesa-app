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
    <Stack.Navigator screenOptions={{ headerShown: false, statusBarStyle: 'dark' }}>
      {/* Tab root — tab bar visible only inside here */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Pushed full-screen routes — tab bar hidden */}
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="PrepMode"
        component={PrepModeScreen}
        options={{ statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="CookMode"
        component={CookModeScreen}
        options={{ statusBarStyle: 'light' }}
      />
      <Stack.Screen
        name="CookModeLight"
        component={CookModeLightScreen}
        options={{ statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="PostCook"
        component={PostCookScreen}
        options={{ statusBarStyle: 'dark' }}
      />
      <Stack.Screen
        name="Showcase"
        component={ShowcaseScreen}
        options={{ statusBarStyle: 'dark' }}
      />

      {/* Modal — slides up from bottom, no tab bar */}
      <Stack.Screen
        name="Import"
        component={ImportScreen}
        options={{ presentation: 'modal', statusBarStyle: 'dark' }}
      />
    </Stack.Navigator>
  );
}
