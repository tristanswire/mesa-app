import { Check, Square, Timer } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export type TimerStatus = 'idle' | 'running' | 'completed';

export interface TimerTokenProps {
  label: string;
  status?: TimerStatus;
  remainingSeconds?: number;
  theme?: 'dark' | 'light';
  onPress?: () => void;
}

export function TimerToken({
  label,
  status = 'idle',
  remainingSeconds = 0,
  theme = 'dark',
  onPress,
}: TimerTokenProps) {
  const { bg, fg } = colorsForState(status, theme);

  let displayText: string;
  if (status === 'running') {
    displayText = formatTime(remainingSeconds);
  } else if (status === 'completed') {
    displayText = `Done · ${label}`;
  } else {
    displayText = label;
  }

  return (
    // Pressable is View-based and renders inline inside a <Text> on iOS, just like
    // IngredientChip's View wrapper. This gives reliable borderRadius + padding
    // clipping while keeping the whole pill tappable.
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Timer: ${label}, ${status}`}
      accessibilityHint={
        status === 'idle'
          ? 'Double tap to start timer'
          : status === 'running'
            ? 'Double tap to cancel timer'
            : 'Double tap to dismiss'
      }
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.chipContent}>
        {status === 'idle' && (
          <Timer size={14} strokeWidth={1.5} color={fg} />
        )}
        {status === 'running' && (
          <Square size={14} strokeWidth={1.5} color={fg} fill={fg} />
        )}
        {status === 'completed' && (
          <Check size={14} strokeWidth={1.5} color={fg} />
        )}
        <RNText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.label, { color: fg }]}
        >
          {displayText}
        </RNText>
      </View>
    </Pressable>
  );
}

function colorsForState(status: TimerStatus, theme: 'dark' | 'light'): { bg: string; fg: string } {
  if (status === 'running') {
    return { bg: colors.terracotta, fg: colors.cream };
  }
  if (status === 'completed') {
    return { bg: colors.olive, fg: colors.cream };
  }
  return {
    bg: colors.oat,
    fg: theme === 'dark' ? colors.pine : colors.ink,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'center',
    maxWidth: '60%',
    // iOS centers inline Views by content height, not text optical center.
    // Calibrated for 20pt cookModeBody / 30pt lineHeight.
    transform: [{ translateY: 5 }],
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
