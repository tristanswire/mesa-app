import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MoreVertical, Sun } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { IngredientChip } from '../../components/IngredientChip';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { TimerToken } from '../../components/TimerToken';
import { completeCook } from '../../data/cooks';
import { useRecipeDetail } from '../../data/hooks';
import { getUserPreferences } from '../../data/preferences';
import type { RecipeDetail } from '../../data/recipes';
import type { MainStackParamList } from '../../navigation/types';
import type { ColorToken } from '../../theme';
import { colors, spacing } from '../../theme';
import { useTimerManager } from './useTimerManager';

type RecipeStep = RecipeDetail['steps'][number];

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
  // For the bottom fade gradient above the nav bar — must match `background`
  // in rgb so the gradient resolves transparent -> background cleanly.
  fadeColor: [string, string];
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
    fadeColor: ['rgba(54, 64, 50, 0)', 'rgba(54, 64, 50, 1)'],
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
    fadeColor: ['rgba(247, 242, 234, 0)', 'rgba(247, 242, 234, 1)'],
  },
};

function stepToPlainText(step: RecipeStep): string {
  return step.segments.map((seg) => {
    if (seg.type === 'text') return seg.content;
    if (seg.type === 'ingredient') {
      return step.ingredients.find((x) => x.id === seg.ingredientId)?.display ?? '';
    }
    return step.timers.find((x) => x.id === seg.timerId)?.label ?? '';
  }).join('');
}

export type CookModeTheme = 'dark' | 'light';

export type CookModeViewProps = {
  recipeId: string;
  initialStepIndex?: number;
  theme: CookModeTheme;
  cookId: string;
  onToggleTheme?: () => void;
};

export function CookModeView({
  recipeId,
  initialStepIndex = 0,
  theme,
  cookId,
  onToggleTheme,
}: CookModeViewProps) {
  useKeepAwake();

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const tc = THEMES[theme];

  const { data: recipe, loading } = useRecipeDetail(recipeId);
  const { timers, startTimer, cancelTimer, dismissCompletedTimer } = useTimerManager();

  const showOverflow = useCallback(() => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          'Cancel',
          theme === 'dark' ? 'Switch to light' : 'Switch to dark',
          'Exit cook mode',
        ],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 2,
        userInterfaceStyle: theme,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) onToggleTheme?.();
        else if (buttonIndex === 2) navigation.goBack();
      },
    );
  }, [theme, onToggleTheme, navigation]);

  const [stepIndex, setStepIndex] = useState(initialStepIndex);

  if (loading || !recipe) {
    return <View style={[styles.root, { backgroundColor: tc.background }]} />;
  }

  const steps = recipe.steps;
  const currentStep = steps[stepIndex];
  const nextStep = steps[stepIndex + 1];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = async () => {
    void Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    if (isLastStep) {
      // Honor the "Show rating prompt after cooking" preference. When OFF,
      // skip PostCook entirely — still mark the cook complete so Profile stats
      // and the "previously rated" check stay accurate.
      let showPrompt = true;
      try {
        const prefs = await getUserPreferences();
        showPrompt = prefs.showRatingPrompt;
      } catch (e) {
        console.error('[cookmode] failed to read prefs, defaulting to show prompt', e);
      }
      if (showPrompt) {
        // replace, not push: PostCook is terminal — finishing it resets to Home,
        // not back into Cook Mode
        navigation.replace('PostCook', { recipeId: recipe.id, cookId });
      } else {
        try {
          await completeCook(cookId);
        } catch (e) {
          console.error('[cookmode] failed to complete cook', e);
        }
        // Reset to Home tab so a finished cook always lands at the app's
        // surface, regardless of which tab the user started from.
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
              state: {
                index: 0,
                routes: [{ name: 'Home' }],
              },
            },
          ],
        });
      }
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
          {tc.showSunIcon && (
            <Sun size={16} color={colors.clay} strokeWidth={1.5} />
          )}
          <IconButton
            icon={MoreVertical}
            tint={tc.overflowTint}
            size="md"
            onPress={showOverflow}
            accessibilityLabel="Cooking options"
          />
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {/* ScrollView lets long step text scroll without overlapping the nav
          bar. contentContainerStyle adds bottom padding so the last line
          can clear the fade gradient when fully scrolled. */}
      <View style={styles.contentWrap}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Step number */}
          <Text role="cookModeStepNumber" color={tc.stepNumberColor} align="right">
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
          <View style={styles.stepBody}>
            {currentStep.segments.flatMap((seg, segIdx) => {
              if (seg.type === 'text') {
                return seg.content
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((word, wIdx) => (
                    <Text
                      key={`text-${segIdx}-${wIdx}`}
                      role="cookModeBody"
                      color={tc.bodyTextColor}
                    >
                      {word}
                    </Text>
                  ));
              }
              if (seg.type === 'ingredient') {
                const ing = currentStep.ingredients.find((x) => x.id === seg.ingredientId);
                return [
                  <IngredientChip
                    key={`ing-${segIdx}`}
                    label={ing?.display ?? ''}
                    theme={tc.chipTheme}
                  />,
                ];
              }
              const timer = currentStep.timers.find((x) => x.id === seg.timerId);
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
                  theme={tc.chipTheme}
                  onPress={() => {
                    if (status === 'idle') {
                      startTimer(timer.id, timer.label, timer.durationSeconds);
                    } else if (status === 'running') {
                      cancelTimer(timer.id);
                    } else {
                      dismissCompletedTimer(timer.id);
                    }
                  }}
                />,
              ];
            })}
          </View>

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
        </ScrollView>

        {/* Bottom fade — hints at scroll overflow. transparent -> background
            so it visually dissolves the last line into the nav bar without a
            hard edge. pointerEvents none keeps scroll + button taps live. */}
        <LinearGradient
          pointerEvents="none"
          colors={tc.fadeColor}
          style={styles.fade}
        />
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
  contentWrap: {
    flex: 1,
    position: 'relative',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    paddingHorizontal: spacing.lg,
    // Bottom padding so the last line scrolls past the fade gradient
    // (FADE_HEIGHT) before hitting the nav bar.
    paddingBottom: 32,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
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
