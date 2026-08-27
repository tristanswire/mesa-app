import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { colors, radii, spacing } from '../../theme';

/** Fixed presets. 1x is the reset. */
const PRESETS: ReadonlyArray<{ label: string; factor: number; a11y: string }> = [
  { label: '1×', factor: 1, a11y: 'Original servings' },
  { label: '½×', factor: 0.5, a11y: 'Half the servings' },
  { label: '¼×', factor: 0.25, a11y: 'Quarter the servings' },
];

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 24;

export type ServingScaleControlProps = {
  /** The recipe's stored serving count — the 1x baseline. */
  baseServings: number;
  /** Current multiplier; 1 means unscaled. */
  scale: number;
  onChange: (scale: number) => void;
};

/**
 * Servings stepper plus ½x / ¼x presets. Scale is a session-only multiplier —
 * this control never writes to the recipe, it just reports the new factor
 * upward for the screen to hold in state and hand to the cook flow.
 *
 * The stepper works in whole servings even when a preset lands on a fraction
 * (¼x of 6 is 1½), so the next ± press snaps back to a countable number.
 */
export function ServingScaleControl({ baseServings, scale, onChange }: ServingScaleControlProps) {
  const base = baseServings > 0 ? baseServings : 1;
  const currentServings = Math.max(MIN_SERVINGS, Math.round(base * scale));
  const atMin = currentServings <= MIN_SERVINGS;
  const atMax = currentServings >= MAX_SERVINGS;

  const step = (delta: number) => {
    const next = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, currentServings + delta));
    if (next === currentServings) return;
    onChange(next / base);
  };

  return (
    <View style={styles.row}>
      <View style={styles.stepper}>
        <StepperButton
          glyph="−"
          disabled={atMin}
          onPress={() => step(-1)}
          accessibilityLabel="Fewer servings"
        />
        <SectionLabel>SERVINGS</SectionLabel>
        <StepperButton
          glyph="+"
          disabled={atMax}
          onPress={() => step(1)}
          accessibilityLabel="More servings"
        />
      </View>

      <View style={styles.presets}>
        {PRESETS.map((preset) => {
          const active = Math.abs(scale - preset.factor) < 1e-9;
          return (
            <Pressable
              key={preset.label}
              onPress={() => onChange(preset.factor)}
              accessibilityRole="button"
              accessibilityLabel={preset.a11y}
              accessibilityState={{ selected: active }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text role="caption" color={active ? 'cream' : 'ink'} style={styles.chipLabel}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepperButton({
  glyph,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  glyph: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.stepperButton,
        disabled && styles.stepperButtonDisabled,
        pressed && !disabled && { opacity: 0.6 },
      ]}
    >
      <Text role="body" color={disabled ? 'inkMuted' : 'ink'} style={styles.stepperGlyph}>
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Wraps to a second line on narrow screens rather than squeezing the chips.
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oat,
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  stepperGlyph: {
    lineHeight: 20,
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.terracotta,
  },
  chipInactive: {
    backgroundColor: colors.oat,
  },
  chipLabel: {
    fontWeight: '600',
  },
});
