import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Bookmark, User } from 'lucide-react-native';
import { TabBar } from '../components';
import type { TabItem } from '../components';

// Icon map — must match Tab.Screen name exactly
const ICON_MAP: Record<string, TabItem['icon']> = {
  Home: Home,
  Recipes: Bookmark,
  Profile: User,
};

export function MesaTabBar({ state, navigation }: BottomTabBarProps) {
  const tabs: TabItem[] = state.routes.map((route) => ({
    key: route.name,
    label: route.name,
    icon: ICON_MAP[route.name] ?? Home,
  }));

  const activeKey = state.routes[state.index].name;

  const handleTabPress = (key: string) => {
    const route = state.routes.find((r) => r.name === key);
    if (!route) return;

    const isFocused = activeKey === key;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(key);
    }
  };

  return <TabBar tabs={tabs} activeKey={activeKey} onTabPress={handleTabPress} />;
}
