import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radii } from '../../theme';
import type { ColorToken } from '../../theme';

type LucideIcon = React.ComponentType<LucideProps>;

const SIZE_MAP = {
  sm: 36,
  md: 44,
  lg: 56,
} as const;

const ICON_SIZE_MAP = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

export interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled';
  tint?: ColorToken;
  accessibilityLabel: string;
}

export function IconButton({
  icon: Icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  tint = 'ink',
  accessibilityLabel,
}: IconButtonProps) {
  const hitSize = SIZE_MAP[size];
  const iconSize = ICON_SIZE_MAP[size];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        {
          width: hitSize,
          height: hitSize,
          backgroundColor: variant === 'filled' ? colors.oat : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon
        size={iconSize}
        color={colors[tint]}
        strokeWidth={1.5}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
