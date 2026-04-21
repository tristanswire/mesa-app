import React from 'react';
import { Pressable, StyleSheet, Text as RNText } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export interface TimerTokenProps {
  label: string;
  durationSeconds: number;
  isActive?: boolean;
  onStart?: () => void;
  theme?: 'dark' | 'light';
}

// Phase 3 will replace with a Lucide Timer icon in a standalone non-inline layout.
const TIMER_GLYPH = '\u25F7 ';

export function TimerToken({
  label,
  durationSeconds,
  isActive = false,
  onStart,
  theme = 'dark',
}: TimerTokenProps) {
  const bg = isActive ? colors.terracotta : colors.oat;
  const textColor = isActive ? colors.cream : theme === 'dark' ? colors.pine : colors.ink;
  const displayLabel = isActive ? formatTime(durationSeconds) : label;

  return (
    // Pressable is View-based and renders inline inside a <Text> on iOS, just like
    // IngredientChip's View wrapper. This gives reliable borderRadius + padding
    // clipping while keeping the whole pill tappable.
    <Pressable
      onPress={onStart}
      accessibilityRole="button"
      accessibilityLabel={`Timer: ${label}`}
      accessibilityHint="Double tap to start timer"
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
    >
      <RNText style={[styles.label, { color: textColor }]}>
        {TIMER_GLYPH}{displayLabel}
      </RNText>
    </Pressable>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    transform: [{ translateY: 8 }],
  },
  label: {
    fontFamily: typography.cookModeIngredientChip.fontFamily,
    fontSize: typography.cookModeIngredientChip.fontSize,
    fontWeight: '700',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.8,
  },
});
