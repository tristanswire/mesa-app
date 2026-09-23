import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Plus, type LucideProps } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

const CAPSULE_HEIGHT = 64;
const ITEM_SIZE = 44;

/**
 * Bottom scroll padding for screens under the capsule, on top of the safe-area
 * inset: 64 capsule + 24 gap + 24 breathing room above the last item.
 */
export const CAPSULE_NAV_CLEARANCE = 112;

export interface CapsuleNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface CapsuleNavProps {
  tabs: CapsuleNavItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  /** The trailing "+" — the app's single Add a recipe entry point. */
  onAddPress: () => void;
}

/**
 * Floating Pine pill that replaces the bottom tab bar. Presentational only:
 * positioning (inset from the screen edges and safe area) is the caller's job,
 * so Showcase can render it inline.
 *
 * Labels are capped for Dynamic Type — like the system tab bar, the capsule's
 * height is fixed, and screen content (which scrolls under it) is where large
 * text sizes apply.
 */
export function CapsuleNav({ tabs, activeKey, onTabPress, onAddPress }: CapsuleNavProps) {
  const handleAdd = () => {
    void Haptics.impactAsync(ImpactFeedbackStyle.Light);
    onAddPress();
  };

  return (
    <View style={styles.capsule} accessibilityRole="tablist">
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                isActive ? styles.activeItem : styles.iconItem,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                size={22}
                color={isActive ? colors.cream : colors.sage}
                strokeWidth={1.6}
              />
              {isActive && (
                <Text
                  role="caption"
                  color="cream"
                  style={styles.activeLabel}
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      <Pressable
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add a recipe"
        testID="nav-add-recipe"
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <Plus size={22} color={colors.pine} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_HEIGHT / 2,
    backgroundColor: colors.pine,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: (CAPSULE_HEIGHT - ITEM_SIZE) / 2,
    boxShadow: '0 12px 32px rgba(31, 28, 25, 0.28)',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeItem: {
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    // Cream at 14% over Pine; Cream label on it is 6.5:1.
    backgroundColor: 'rgba(247, 242, 234, 0.14)',
  },
  activeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(247, 242, 234, 0.18)',
  },
  addButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
