import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CookingFrequencyScreen,
  CookModeScreen,
  DefaultServingSizeScreen,
  DietaryPreferencesScreen,
  ImportScreen,
  PostCookScreen,
  PrepModeScreen,
  RecipeDetailScreen,
  ShowcaseScreen,
  SkillLevelScreen,
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
      <Stack.Screen name="PostCook" component={PostCookScreen} />
      <Stack.Screen name="Showcase" component={ShowcaseScreen} />

      {/* Profile preference edit screens */}
      <Stack.Screen name="CookingFrequency" component={CookingFrequencyScreen} />
      <Stack.Screen name="DietaryPreferences" component={DietaryPreferencesScreen} />
      <Stack.Screen name="SkillLevel" component={SkillLevelScreen} />
      <Stack.Screen name="DefaultServingSize" component={DefaultServingSizeScreen} />

      {/* Modal — slides up from bottom, no tab bar */}
      <Stack.Screen
        name="Import"
        component={ImportScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
