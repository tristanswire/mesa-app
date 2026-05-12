import { Check, Square, Timer } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { colors } from '../../theme';

export type TimerStatus = 'idle' | 'running' | 'completed';

export interface TimerTokenProps {
  label: string;
  status?: TimerStatus;
  remainingSeconds?: number;
  theme?: 'dark' | 'light';
  onPress?: () => void;
}

// Larger, non-bold pill that reads as a clear button affordance while still
// flowing inline with the surrounding 20pt body text. Idle background flips by
// surface — Oat on Pine, Terracotta on Cream — so the pill always has enough
// contrast against the page. Running state is Terracotta in both modes so a
// counting-down timer reads the same regardless of theme.
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
    // Pressable-in-Text: on iOS, a Pressable as a direct child of <Text>
    // renders inline. alignSelf:'center' keeps the pill vertically centered
    // on the body's line-box across wraps.
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
          <Timer size={16} strokeWidth={1.5} color={fg} />
        )}
        {status === 'running' && (
          <Square size={16} strokeWidth={1.5} color={fg} fill={fg} />
        )}
        {status === 'completed' && (
          <Check size={16} strokeWidth={1.5} color={fg} />
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

function colorsForState(
  status: TimerStatus,
  theme: 'dark' | 'light',
): { bg: string; fg: string } {
  if (status === 'running') {
    return { bg: colors.terracotta, fg: colors.cream };
  }
  if (status === 'completed') {
    return { bg: colors.olive, fg: colors.cream };
  }
  // Idle — flips by surface so the pill always reads
  return theme === 'dark'
    ? { bg: colors.oat, fg: colors.pine }
    : { bg: colors.terracotta, fg: colors.cream };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    // iOS centers inline Views by content height, not text optical center.
    // With 20pt text in a 30pt line-box, the pill is ~28pt tall — a small
    // translateY brings the pill's center to the body's optical baseline.
    transform: [{ translateY: 2 }],
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.85,
  },
});
