import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MoreVertical } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'CookMode'>;

function stepToPlainText(step: MockStep): string {
  return step.segments.map((seg) => {
    if (seg.type === 'text') return seg.content;
    if (seg.type === 'ingredient') {
      return step.ingredients.find((x) => x.id === seg.ingredientId)?.display ?? '';
    }
    return step.timers.find((x) => x.id === seg.timerId)?.label ?? '';
  }).join('');
}

export function CookModeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const recipe = getMockRecipeOrFallback(route.params.recipeId);
  const steps = recipe.steps;

  const [stepIndex, setStepIndex] = useState(route.params.stepIndex ?? 0);

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
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.base }]}>
        <SectionLabel color="clay">{`STEP ${stepIndex + 1} OF ${steps.length}`}</SectionLabel>
        <IconButton
          icon={MoreVertical}
          tint="cream"
          size="md"
          onPress={() => {
            // TODO Phase 3: cook mode options (exit, light variant, text size)
          }}
          accessibilityLabel="Cooking options"
        />
      </View>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Step number */}
        <Text role="cookModeStepNumber" align="right">
          {String(stepIndex + 1).padStart(2, '0')}
        </Text>

        <View style={{ height: spacing.lg }} />

        {/* Step body with inline chips and timers */}
        <Text role="cookModeBody" color="cream">
          {currentStep.segments.map((seg, i) => {
            if (seg.type === 'text') return seg.content;
            if (seg.type === 'ingredient') {
              const ing = currentStep.ingredients.find((x) => x.id === seg.ingredientId);
              return (
                <IngredientChip key={`ing-${i}`} label={ing?.display ?? ''} theme="dark" />
              );
            }
            const timer = currentStep.timers.find((x) => x.id === seg.timerId);
            return (
              <TimerToken
                key={`timer-${i}`}
                label={timer?.label ?? ''}
                durationSeconds={timer?.durationSeconds ?? 0}
                isActive={false}
                theme="dark"
              />
            );
          })}
        </Text>

        <View style={{ height: spacing.xl }} />

        {/* Divider */}
        <View style={styles.divider} />

        <View style={{ height: spacing.lg }} />

        {/* NEXT preview */}
        {nextStep ? (
          <>
            <SectionLabel color="clay">NEXT</SectionLabel>
            <View style={{ height: spacing.sm }} />
            <Text role="cookModeBody" color="creamMuted" numberOfLines={2}>
              {stepToPlainText(nextStep)}
            </Text>
          </>
        ) : (
          <>
            <SectionLabel color="clay">ALMOST THERE</SectionLabel>
            <View style={{ height: spacing.sm }} />
            <Text role="cookModeBody" color="creamMuted" numberOfLines={2}>
              Last step — you're almost done.
            </Text>
          </>
        )}
      </View>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + spacing.base },
        ]}
      >
        {/* Step indicator dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === stepIndex ? 6 : 4,
                  backgroundColor:
                    i === stepIndex ? colors.terracotta : 'rgba(247, 242, 234, 0.3)',
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
    backgroundColor: colors.pine,
  },
  // ── Top bar ─────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
  },
  // ── Content ─────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(247, 242, 234, 0.2)',
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
