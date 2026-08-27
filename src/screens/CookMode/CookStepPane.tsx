import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IngredientChip } from '../../components/IngredientChip';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { TimerToken } from '../../components/TimerToken';
import type { MeasurementSystem } from '../../data/preferences';
import type { RecipeDetail } from '../../data/recipes';
import {
  convertInlineAmounts,
  convertLeadingAmount,
  scaleAmount,
  scaleInlineAmounts,
} from '../../lib/units';
import type { ColorToken } from '../../theme';
import { spacing } from '../../theme';
import { COOK_TEXT_MAX_FONT_MULTIPLIER } from './textSize';
import type { TimerState } from './useTimerManager';

type RecipeStep = RecipeDetail['steps'][number];

/** The subset of the Cook Mode theme a pane needs to paint itself. */
export type PaneTheme = {
  stepNumberColor: ColorToken;
  sectionLabelColor: ColorToken;
  bodyTextColor: ColorToken;
  nextPreviewColor: ColorToken;
  divider: string;
  chipTheme: 'dark' | 'light';
};

export type CookStepPaneProps = {
  step: RecipeStep;
  /** Zero-based; displayed as a padded 1-based number. */
  stepIndex: number;
  /** The following step, used for the NEXT preview. Undefined on the last step. */
  nextStep: RecipeStep | undefined;
  theme: PaneTheme;
  textScale: { fontSize: number; lineHeight: number; columnGap: number };
  timers: Record<string, TimerState>;
  onTimerPress: (timerId: string, label: string, durationSeconds: number) => void;
  /** Chips are stored as display strings, so conversion happens at render. */
  system: MeasurementSystem;
  /** Session-only serving multiplier; 1 means unscaled. */
  scale: number;
};

/**
 * A chip's stored display string ("2 tbsp olive oil") rendered for the current
 * session: scaled first, then converted. That order matters — scaleAmount emits
 * cooking fractions that convertLeadingAmount can read back, not the reverse.
 */
function displayChip(text: string, system: MeasurementSystem, scale: number): string {
  return convertLeadingAmount(scaleAmount(text, scale), system);
}

/**
 * Step prose gets the same treatment as the chips beside it — a chip reading
 * "30 ml olive oil" next to a sentence saying "2 tablespoons" is worse than no
 * conversion at all. The inline scanner is narrower than the chip parser and
 * leaves anything it can't vouch for untouched.
 */
function displayStepText(text: string, system: MeasurementSystem, scale: number): string {
  return convertInlineAmounts(scaleInlineAmounts(text, scale), system);
}

export function stepToPlainText(
  step: RecipeStep,
  system: MeasurementSystem,
  scale: number,
): string {
  return step.segments
    .map((seg) => {
      if (seg.type === 'text') return displayStepText(seg.content, system, scale);
      if (seg.type === 'ingredient') {
        const display = step.ingredients.find((x) => x.id === seg.ingredientId)?.display;
        // Same treatment the chips get, so the NEXT preview can't disagree
        // with the step it is previewing.
        return display ? displayChip(display, system, scale) : '';
      }
      return step.timers.find((x) => x.id === seg.timerId)?.label ?? '';
    })
    .join('');
}

/**
 * One step's content — the scrollable column that slides horizontally during
 * swipe navigation. Extracted from CookModeView so the carousel can mount the
 * previous, current, and next steps simultaneously; each pane owns its own
 * vertical ScrollView so long step text still scrolls independently.
 */
export function CookStepPane({
  step,
  stepIndex,
  nextStep,
  theme,
  textScale,
  timers,
  onTimerPress,
  system,
  scale,
}: CookStepPaneProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
    >
      {/* Step number */}
      <Text role="cookModeStepNumber" color={theme.stepNumberColor} align="right">
        {String(stepIndex + 1).padStart(2, '0')}
      </Text>

      <View style={{ height: spacing.lg }} />

      {/* Step body — flex-wrap layout. RN's inline-Pressable-in-Text
          rendering is unreliable (the timer pill anchors to the text
          baseline and forces its line taller, breaking the flow above
          it). Splitting each text segment into per-word <Text> items
          lets words wrap individually inside a flex row, and the pill
          becomes an ordinary flex item that aligns naturally on its
          line. cookModeBody lineHeight is 30; TimerToken is sized to
          30 so rows containing a pill match rows of plain text. */}
      <View style={[styles.stepBody, { columnGap: textScale.columnGap }]}>
        {step.segments.flatMap((seg, segIdx) => {
          if (seg.type === 'text') {
            return displayStepText(seg.content, system, scale)
              .split(/\s+/)
              .filter(Boolean)
              .map((word, wIdx) => (
                <Text
                  key={`text-${segIdx}-${wIdx}`}
                  role="cookModeBody"
                  color={theme.bodyTextColor}
                  style={{ fontSize: textScale.fontSize, lineHeight: textScale.lineHeight }}
                  maxFontSizeMultiplier={COOK_TEXT_MAX_FONT_MULTIPLIER}
                >
                  {word}
                </Text>
              ));
          }
          if (seg.type === 'ingredient') {
            const ing = step.ingredients.find((x) => x.id === seg.ingredientId);
            return [
              <IngredientChip
                key={`ing-${segIdx}`}
                label={ing ? displayChip(ing.display, system, scale) : ''}
                theme={theme.chipTheme}
              />,
            ];
          }
          const timer = step.timers.find((x) => x.id === seg.timerId);
          if (!timer) return [];
          const state = timers[timer.id];
          const status = state?.status ?? 'idle';
          const remaining = state?.remainingSeconds ?? 0;
          return [
            <TimerToken
              key={`timer-${segIdx}`}
              label={timer.label}
              status={status}
              remainingSeconds={remaining}
              theme={theme.chipTheme}
              onPress={() => onTimerPress(timer.id, timer.label, timer.durationSeconds)}
            />,
          ];
        })}
      </View>

      <View style={{ height: spacing.xl }} />

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      <View style={{ height: spacing.lg }} />

      {/* NEXT preview */}
      {nextStep ? (
        <>
          <SectionLabel color={theme.sectionLabelColor}>NEXT</SectionLabel>
          <View style={{ height: spacing.sm }} />
          <Text role="cookModeBody" color={theme.nextPreviewColor} numberOfLines={2}>
            {stepToPlainText(nextStep, system, scale)}
          </Text>
        </>
      ) : (
        <>
          <SectionLabel color={theme.sectionLabelColor}>ALMOST THERE</SectionLabel>
          <View style={{ height: spacing.sm }} />
          <Text role="cookModeBody" color={theme.nextPreviewColor} numberOfLines={2}>
            Last step — you&apos;re almost done.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
    // Bottom padding so the last line scrolls past the fade gradient
    // (FADE_HEIGHT) before hitting the nav bar.
    paddingBottom: 32,
  },
  stepBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    // columnGap approximates a single space at the 20pt body font.
    // rowGap stays 0 — each word/chip flex item already provides its own
    // lineHeight (30pt), so wrapped rows have the same vertical rhythm
    // as the prior single-Text rendering.
    columnGap: 5,
    rowGap: 0,
  },
  divider: {
    height: 1,
  },
});
