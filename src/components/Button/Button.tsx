import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

export interface ButtonProps {
  variant: 'primary' | 'secondary';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
}

export function Button({
  variant,
  label,
  onPress,
  disabled = false,
  fullWidth = true,
  hapticFeedback = true,
  accessibilityLabel,
}: ButtonProps) {
  const handlePress = async () => {
    if (hapticFeedback) await Haptics.selectionAsync();
    onPress();
  };

  const bg = variant === 'primary' ? colors.terracotta : colors.oat;
  const textColor = variant === 'primary' ? 'cream' : 'ink';

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
      <Text
        role="body"
        color={textColor}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
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
  label: {
    fontWeight: '600',
  },
});
