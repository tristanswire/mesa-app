import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MoreVertical, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { IngredientChip } from '../../components/IngredientChip';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { TimerToken } from '../../components/TimerToken';
import type { MainStackParamList } from '../../navigation/types';
import { getMockRecipeOrFallback } from '../../mocks/recipes';
import type { MockStep } from '../../mocks/recipes';
import type { ColorToken } from '../../theme';
import { colors, spacing } from '../../theme';

type CookTheme = {
  background: string;
  statusBarStyle: 'light' | 'dark';
  overflowTint: ColorToken;
  stepNumberColor: ColorToken;
  bodyTextColor: ColorToken;
  nextPreviewColor: ColorToken;
  divider: string;
  chipTheme: 'dark' | 'light';
  dotInactive: string;
  showSunIcon: boolean;
};

const THEMES: Record<'dark' | 'light', CookTheme> = {
  dark: {
    background: colors.pine,
    statusBarStyle: 'light',
    overflowTint: 'cream',
    stepNumberColor: 'creamMuted',
    bodyTextColor: 'cream',
    nextPreviewColor: 'creamMuted',
    divider: 'rgba(247, 242, 234, 0.2)',
    chipTheme: 'dark',
    dotInactive: 'rgba(247, 242, 234, 0.3)',
    showSunIcon: false,
  },
  light: {
    background: colors.cream,
    statusBarStyle: 'dark',
    overflowTint: 'oliveDark',
    stepNumberColor: 'clay',
    bodyTextColor: 'ink',
    nextPreviewColor: 'inkMuted',
    divider: 'rgba(31, 28, 25, 0.1)',
    chipTheme: 'light',
    dotInactive: 'rgba(31, 28, 25, 0.2)',
    showSunIcon: true,
  },
};

function stepToPlainText(step: MockStep): string {
  return step.segments.map((seg) => {
    if (seg.type === 'text') return seg.content;
    if (seg.type === 'ingredient') {
      return step.ingredients.find((x) => x.id === seg.ingredientId)?.display ?? '';
    }
    return step.timers.find((x) => x.id === seg.timerId)?.label ?? '';
  }).join('');
}

export type CookModeViewProps = {
  recipeId: string;
  initialStepIndex?: number;
  theme: 'dark' | 'light';
};

export function CookModeView({ recipeId, initialStepIndex = 0, theme }: CookModeViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const tc = THEMES[theme];

  const recipe = getMockRecipeOrFallback(recipeId);
  const steps = recipe.steps;

  const [stepIndex, setStepIndex] = useState(initialStepIndex);

  const currentStep = steps[stepIndex];
  const nextStep = steps[stepIndex + 1];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    void Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    if (isLastStep) {
      navigation.navigate('PostCook', { recipeId: recipe.id });
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    void Haptics.impactAsync(ImpactFeedbackStyle.Light);
    setStepIndex((i) => i - 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.statusBarStyle} />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.base }]}>
        <SectionLabel color="clay">{`STEP ${stepIndex + 1} OF ${steps.length}`}</SectionLabel>
        <View style={styles.topBarRight}>
          {/* TODO Phase 3 removes this — replaced by useColorScheme() auto-switching */}
          {theme === 'dark' && (
            <Pressable
              onPress={() => navigation.navigate('CookModeLight', { recipeId, stepIndex })}
              hitSlop={8}
            >
              <Text role="caption" color="creamMuted">Light variant →</Text>
            </Pressable>
          )}
          {tc.showSunIcon && (
            <Sun size={16} color={colors.clay} strokeWidth={1.5} />
          )}
          <IconButton
            icon={MoreVertical}
            tint={tc.overflowTint}
            size="md"
            onPress={() => {
              // TODO Phase 3: cook mode options (exit, light/dark toggle, text size)
            }}
            accessibilityLabel="Cooking options"
          />
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Step number */}
        <Text role="cookModeStepNumber" color={tc.stepNumberColor} align="right">
          {String(stepIndex + 1).padStart(2, '0')}
        </Text>

        <View style={{ height: spacing.lg }} />

        {/* Step body with inline chips and timers */}
        <Text role="cookModeBody" color={tc.bodyTextColor}>
          {currentStep.segments.map((seg, i) => {
            if (seg.type === 'text') return seg.content;
            if (seg.type === 'ingredient') {
              const ing = currentStep.ingredients.find((x) => x.id === seg.ingredientId);
              return (
                <IngredientChip key={`ing-${i}`} label={ing?.display ?? ''} theme={tc.chipTheme} />
              );
            }
            const timer = currentStep.timers.find((x) => x.id === seg.timerId);
            return (
              <TimerToken
                key={`timer-${i}`}
                label={timer?.label ?? ''}
                durationSeconds={timer?.durationSeconds ?? 0}
                isActive={false}
                theme={tc.chipTheme}
              />
            );
          })}
        </Text>

        <View style={{ height: spacing.xl }} />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: tc.divider }]} />

        <View style={{ height: spacing.lg }} />

        {/* NEXT preview */}
        {nextStep ? (
          <>
            <SectionLabel color="clay">NEXT</SectionLabel>
            <View style={{ height: spacing.sm }} />
            <Text role="cookModeBody" color={tc.nextPreviewColor} numberOfLines={2}>
              {stepToPlainText(nextStep)}
            </Text>
          </>
        ) : (
          <>
            <SectionLabel color="clay">ALMOST THERE</SectionLabel>
            <View style={{ height: spacing.sm }} />
            <Text role="cookModeBody" color={tc.nextPreviewColor} numberOfLines={2}>
              Last step — you're almost done.
            </Text>
          </>
        )}
      </View>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base }]}>
        {/* Step indicator dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === stepIndex ? 6 : 4,
                  backgroundColor: i === stepIndex ? colors.terracotta : tc.dotInactive,
                },
              ]}
            />
          ))}
        </View>

        <View style={{ height: spacing.base }} />

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          <View style={styles.navBtn}>
            <Button
              variant="secondary"
              label="← Previous"
              onPress={handlePrev}
              disabled={isFirstStep}
            />
          </View>
          <View style={styles.navBtn}>
            <Button
              variant="primary"
              label={isLastStep ? 'Finish Cooking →' : 'Next Step →'}
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // ── Top bar ─────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // ── Content ─────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
  },
  // ── Bottom bar ──────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navBtn: {
    flex: 1,
  },
});
