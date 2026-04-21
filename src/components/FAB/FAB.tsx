import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Plus, type LucideProps } from 'lucide-react-native';
import { colors, radii, shadows, spacing } from '../../theme';

type LucideIcon = React.ComponentType<LucideProps>;

export interface FABProps {
  icon?: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
}

export function FAB({ icon: Icon = Plus, onPress, accessibilityLabel }: FABProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: spacing.base,
          right: spacing.base,
        },
        pressed && styles.pressed,
      ]}
    >
      {/* FAB uses strokeWidth=2 (intentional exception to the 1.5 default).
          FAB icons need more visual presence at this size and usage context. */}
      <Icon size={24} color={colors.cream} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.terracotta,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fabStrong,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});
