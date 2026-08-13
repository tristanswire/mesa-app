import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface ButtonProps {
  // `cookPrimary` is the primary CTA on the Pine cook surface — a Cream fill with
  // Pine text. The global `primary` (Terracotta) fails contrast on Pine (2.22:1).
  variant: 'primary' | 'secondary' | 'cookPrimary';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
  /** Optional leading icon. Rendered in the label's color at 1.5px stroke. */
  icon?: LucideIcon;
}

export function Button({
  variant,
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  hapticFeedback = true,
  accessibilityLabel,
  icon: Icon,
}: ButtonProps) {
  const handlePress = async () => {
    if (hapticFeedback) await Haptics.selectionAsync();
    onPress();
  };

  const bg =
    variant === 'primary'
      ? colors.terracotta
      : variant === 'cookPrimary'
        ? colors.cream
        : colors.oat;
  const textColor =
    variant === 'primary' ? 'cream' : variant === 'cookPrimary' ? 'pine' : 'ink';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {Icon && <Icon size={20} color={colors[textColor]} strokeWidth={1.5} />}
        <Text
          role="body"
          color={textColor}
          numberOfLines={1}
          style={styles.label}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  // Row so an optional leading icon sits beside the label; with no icon this
  // collapses to the previous centered-label layout.
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
});
