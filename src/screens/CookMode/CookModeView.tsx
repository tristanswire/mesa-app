import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MoreVertical, Sun } from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, type ButtonProps } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { SectionLabel } from '../../components/SectionLabel';
import { CookStepPane, type PaneTheme } from './CookStepPane';
import { completeCook } from '../../data/cooks';
import { useRecipeDetail } from '../../data/hooks';
import { getUserPreferences } from '../../data/preferences';
import type { MainStackParamList } from '../../navigation/types';
import type { ColorToken } from '../../theme';
import { colors, spacing } from '../../theme';
import { COOK_TEXT_SCALE, COOK_TEXT_SIZE_LABELS, type CookTextSize } from './textSize';
import { useTimerManager } from './useTimerManager';

type CookTheme = {
  background: string;
  statusBarStyle: 'light' | 'dark';
  // Primary CTA fill must contrast with `background`: `cookPrimary` is a Cream
  // fill (for Pine), `primary` is a Terracotta fill (for Cream). Picking per
  // theme keeps the button from rendering background-on-background.
  primaryButtonVariant: ButtonProps['variant'];
  overflowTint: ColorToken;
  stepNumberColor: ColorToken;
  sectionLabelColor: ColorToken;
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
    // Cream fill / Pine text — Terracotta fails contrast on Pine (2.22:1).
    primaryButtonVariant: 'cookPrimary',
    overflowTint: 'cream',
    stepNumberColor: 'creamMuted',
    // Oat reads clearly on Pine; Olive Dark would be dark-on-dark.
    sectionLabelColor: 'oat',
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
    // Terracotta fill — the app-wide primary CTA. `cookPrimary` here would be a
    // Cream fill on a Cream background, i.e. an invisible button.
    primaryButtonVariant: 'primary',
    overflowTint: 'oliveDark',
    // Terracotta passes AA on Cream (6.97:1) and anchors the step as brand accent.
    stepNumberColor: 'terracotta',
    sectionLabelColor: 'oliveDark',
    bodyTextColor: 'ink',
    nextPreviewColor: 'inkMuted',
    divider: 'rgba(31, 28, 25, 0.1)',
    chipTheme: 'light',
    dotInactive: 'rgba(31, 28, 25, 0.2)',
    showSunIcon: true,
    fadeColor: ['rgba(247, 242, 234, 0)', 'rgba(247, 242, 234, 1)'],
  },
};

// Swipe must be deliberate: commit on either enough horizontal travel OR a
// fast flick in the same direction. Distance is a fraction of screen width so
// the feel is consistent across device sizes; velocity catches quick flicks
// that never travel far.
const SWIPE_COMMIT_FRACTION = 0.3;
const SWIPE_COMMIT_VELOCITY = 500;

/** Slide duration on commit. Fast enough not to delay a cook mid-task. */
const SLIDE_DURATION_MS = 280;

/**
 * Drag past the first/last step is damped rather than blocked outright, so the
 * edge reads as "nothing there" instead of a frozen screen.
 */
const EDGE_RESISTANCE = 0.25;

export type CookModeTheme = 'dark' | 'light';

export type CookModeViewProps = {
  recipeId: string;
  initialStepIndex?: number;
  theme: CookModeTheme;
  cookId: string;
  onToggleTheme?: () => void;
  textSize: CookTextSize;
  onSetTextSize: (size: CookTextSize) => void;
};

export function CookModeView({
  recipeId,
  initialStepIndex = 0,
  theme,
  cookId,
  onToggleTheme,
  textSize,
  onSetTextSize,
}: CookModeViewProps) {
  useKeepAwake();

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const tc = THEMES[theme];

  const { data: recipe, loading } = useRecipeDetail(recipeId);
  const { timers, startTimer, cancelTimer, dismissCompletedTimer } = useTimerManager();

  const showOverflow = useCallback(() => {
    // Fixed option order so the index→action mapping below stays stable. The
    // current text size is marked with a checkmark.
    const sizeLabel = (size: CookTextSize) =>
      `Text size: ${COOK_TEXT_SIZE_LABELS[size]}${textSize === size ? '  ✓' : ''}`;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          'Cancel',
          theme === 'dark' ? 'Switch to light' : 'Switch to dark',
          sizeLabel('M'),
          sizeLabel('L'),
          sizeLabel('XL'),
          'Exit cook mode',
        ],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 5,
        userInterfaceStyle: theme,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) onToggleTheme?.();
        else if (buttonIndex === 2) onSetTextSize('M');
        else if (buttonIndex === 3) onSetTextSize('L');
        else if (buttonIndex === 4) onSetTextSize('XL');
        else if (buttonIndex === 5) navigation.goBack();
      },
    );
  }, [theme, onToggleTheme, navigation, textSize, onSetTextSize]);

  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const { width: screenWidth } = useWindowDimensions();

  // Horizontal offset of the 3-pane row. 0 = current step centered; -width =
  // next step centered; +width = previous step centered.
  const translateX = useSharedValue(0);

  // Gesture worklets run on the UI thread and can't read React state, so the
  // bounds they need are mirrored into shared values.
  const stepIndexSV = useSharedValue(initialStepIndex);
  const lastIndexSV = useSharedValue(0);
  const widthSV = useSharedValue(screenWidth);

  useEffect(() => {
    widthSV.value = screenWidth;
  }, [screenWidth, widthSV]);

  useEffect(() => {
    stepIndexSV.value = stepIndex;
  }, [stepIndex, stepIndexSV]);

  /**
   * Reset the row offset *after* the step index changes, not inside the
   * animation callback. When the slide finishes, the row sits at ∓width with
   * the incoming pane visually centered; once stepIndex updates, that pane is
   * re-rendered at offset 0, so setting translateX back to 0 here is a no-op
   * visually. Resetting earlier would flash the outgoing step for one frame.
   */
  useLayoutEffect(() => {
    translateX.value = 0;
  }, [stepIndex, translateX]);

  const goToStep = useCallback((delta: 1 | -1) => {
    setStepIndex((i) => i + delta);
  }, []);

  /**
   * Animate the row one step in `direction`, then commit the index change.
   * Shared by the gesture and the Previous/Next buttons so both produce the
   * identical transition.
   */
  const slideTo = useCallback(
    (direction: 1 | -1) => {
      'worklet';
      translateX.value = withTiming(
        -direction * widthSV.value,
        { duration: SLIDE_DURATION_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(goToStep)(direction);
        },
      );
    },
    [translateX, widthSV, goToStep],
  );

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        // Only claim the gesture after a deliberate horizontal move; fail on
        // vertical movement so the ScrollView keeps long step text scrollable.
        // Activation needs 16px of horizontal travel, so a stationary tap on a
        // timer chip is never captured — the chip's Pressable still fires.
        .activeOffsetX([-16, 16])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          const atFirst = stepIndexSV.value === 0;
          const atLast = stepIndexSV.value === lastIndexSV.value;
          const dx = e.translationX;
          // Damp drags that would move past either end — there is no pane to
          // reveal, so the row rubber-bands instead of tracking the finger.
          const pastEdge = (dx > 0 && atFirst) || (dx < 0 && atLast);
          translateX.value = pastEdge ? dx * EDGE_RESISTANCE : dx;
        })
        .onEnd((e) => {
          const atFirst = stepIndexSV.value === 0;
          const atLast = stepIndexSV.value === lastIndexSV.value;
          const dx = e.translationX;
          const vx = e.velocityX;
          const commitDistance = widthSV.value * SWIPE_COMMIT_FRACTION;

          const swipedLeft = dx <= -commitDistance || (dx < 0 && vx <= -SWIPE_COMMIT_VELOCITY);
          const swipedRight = dx >= commitDistance || (dx > 0 && vx >= SWIPE_COMMIT_VELOCITY);

          // Boundaries: never past the last step (finishing the cook stays a
          // deliberate button tap, not an over-swipe) and never before step 1.
          if (swipedLeft && !atLast) {
            slideTo(1);
          } else if (swipedRight && !atFirst) {
            slideTo(-1);
          } else {
            // Not committed (or blocked at an edge) — settle back to center.
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        }),
    [stepIndexSV, lastIndexSV, widthSV, translateX, slideTo],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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
      // Same transition the gesture produces, so buttons and swipe read as one
      // system rather than two ways of changing the step.
      slideTo(1);
    }
  };

  const handlePrev = () => {
    if (isFirstStep) return;
    void Haptics.impactAsync(ImpactFeedbackStyle.Light);
    slideTo(-1);
  };

  // Mirror the step bounds for the gesture worklets. Assigned during render so
  // they track `steps` without an extra effect; both are plain numbers.
  lastIndexSV.value = steps.length - 1;

  // Cook Mode step-text scale (M/L/XL). Applies to the instruction text only —
  // the step number and ingredient/timer chips keep their own sizes.
  const textScale = COOK_TEXT_SCALE[textSize];

  // The pane-facing slice of the active theme. Identical values to before the
  // carousel refactor — light and dark are unchanged by the animation work.
  const paneTheme: PaneTheme = {
    stepNumberColor: tc.stepNumberColor,
    sectionLabelColor: tc.sectionLabelColor,
    bodyTextColor: tc.bodyTextColor,
    nextPreviewColor: tc.nextPreviewColor,
    divider: tc.divider,
    chipTheme: tc.chipTheme,
  };

  // Timer taps cycle idle -> running -> cancel, and dismiss once completed.
  const handleTimerPress = (timerId: string, label: string, durationSeconds: number) => {
    const status = timers[timerId]?.status ?? 'idle';
    if (status === 'idle') startTimer(timerId, label, durationSeconds);
    else if (status === 'running') cancelTimer(timerId);
    else dismissCompletedTimer(timerId);
  };

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.statusBarStyle} />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.base }]}>
        <SectionLabel color={tc.sectionLabelColor}>{`STEP ${stepIndex + 1} OF ${steps.length}`}</SectionLabel>
        <View style={styles.topBarRight}>
          {tc.showSunIcon && (
            <Sun size={16} color={colors.pine} strokeWidth={1.5} />
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
      {/* A 3-pane row (previous / current / next) that slides horizontally.
          Each pane owns its vertical ScrollView so long step text still
          scrolls; the gesture's failOffsetY yields to that scroll. */}
      <View style={styles.contentWrap}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.paneRow, rowStyle]}>
            {[-1, 0, 1].map((offset) => {
              const paneIndex = stepIndex + offset;
              const paneStep = steps[paneIndex];
              // Edges have no neighbor to render — the gap is never visible
              // because the row can't travel past it (see EDGE_RESISTANCE).
              if (!paneStep) {
                return (
                  <View
                    key={`pane-empty-${offset}`}
                    style={[styles.pane, { width: screenWidth, left: offset * screenWidth }]}
                  />
                );
              }
              return (
                <View
                  key={`pane-${paneIndex}`}
                  style={[styles.pane, { width: screenWidth, left: offset * screenWidth }]}
                  // Only the centered pane is exposed to assistive tech, so a
                  // screen reader never reads the neighboring steps.
                  accessibilityElementsHidden={offset !== 0}
                  importantForAccessibility={offset === 0 ? 'auto' : 'no-hide-descendants'}
                  pointerEvents={offset === 0 ? 'auto' : 'none'}
                >
                  <CookStepPane
                    step={paneStep}
                    stepIndex={paneIndex}
                    nextStep={steps[paneIndex + 1]}
                    theme={paneTheme}
                    textScale={textScale}
                    timers={timers}
                    onTimerPress={handleTimerPress}
                  />
                </View>
              );
            })}
          </Animated.View>
        </GestureDetector>

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
              variant={tc.primaryButtonVariant}
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
  // The sliding row fills contentWrap; panes are absolutely positioned within
  // it at -1/0/+1 screen widths so only the transform animates.
  paneRow: {
    flex: 1,
  },
  pane: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
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
