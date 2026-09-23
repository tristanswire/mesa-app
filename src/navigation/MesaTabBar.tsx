import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bookmark, User } from 'lucide-react-native';
import { CapsuleNav } from '../components';
import type { CapsuleNavItem } from '../components';
import { spacing } from '../theme';

// Icon map — must match Tab.Screen name exactly
const ICON_MAP: Record<string, CapsuleNavItem['icon']> = {
  Home: Home,
  Recipes: Bookmark,
  Profile: User,
};

/**
 * The floating capsule, absolutely positioned so tab screens lay out full
 * height and scroll under it. Each tab screen pads its scroll content by
 * CAPSULE_NAV_CLEARANCE + the bottom safe-area inset.
 */
export function MesaTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabs: CapsuleNavItem[] = state.routes.map((route) => ({
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

  return (
    // box-none: the wrapper spans the screen width but only the capsule
    // itself takes touches, so content beside it stays scrollable.
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + spacing.lg }]}
    >
      <CapsuleNav
        tabs={tabs}
        activeKey={activeKey}
        onTabPress={handleTabPress}
        // Import lives on the parent Main stack; navigate bubbles up to it.
        onAddPress={() => navigation.navigate('Import')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
