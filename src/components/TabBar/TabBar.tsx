import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideProps } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export const TAB_BAR_HEIGHT = 64;

export interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
}

export function TabBar({ tabs, activeKey, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const iconColor = isActive ? colors.terracotta : colors.oliveDark;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
          >
            <tab.icon
              size={24}
              color={iconColor}
              strokeWidth={1.5}
            />
            <View style={{ height: spacing.xs }} />
            <Text
              role="caption"
              color={isActive ? 'terracotta' : 'oliveDark'}
              style={styles.tabLabel}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.oat,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  tabLabel: {
    fontWeight: '500',
  },
});
