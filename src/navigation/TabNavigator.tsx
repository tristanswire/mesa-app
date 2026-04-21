import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen, RecipesScreen, ProfileScreen } from '../screens';
import { MesaTabBar } from './MesaTabBar';
import type { TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MesaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
