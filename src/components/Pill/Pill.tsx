import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

export interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function Pill({ label, active, onPress }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text role="caption" color={active ? 'cream' : 'ink'} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  pillActive: {
    backgroundColor: colors.terracotta,
  },
  pillInactive: {
    backgroundColor: colors.oat,
  },
  label: {
    fontWeight: '500',
  },
});
