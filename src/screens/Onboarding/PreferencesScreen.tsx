import * as Haptics from 'expo-haptics';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import {
  completeOnboarding,
  type CookingFrequency,
  type SkillLevel,
} from '../../data/preferences';
import { colors, spacing } from '../../theme';
import { ProgressDots } from './ProgressDots';

const FREQUENCY_OPTIONS = ['1-2x a week', '3-5x a week', 'Every day'] as const;
const DIETARY_OPTIONS = ['Vegetarian', 'Gluten-free', 'Dairy-free', 'None'] as const;
const SKILL_OPTIONS = ['Weeknight cook', 'Enthusiast', 'Pro'] as const;

const FREQUENCY_TO_ENUM: Record<(typeof FREQUENCY_OPTIONS)[number], CookingFrequency> = {
  '1-2x a week': '1-2x',
  '3-5x a week': '3-5x',
  'Every day': 'every-day',
};

const SKILL_TO_ENUM: Record<(typeof SKILL_OPTIONS)[number], SkillLevel> = {
  'Weeknight cook': 'weeknight',
  Enthusiast: 'enthusiast',
  Pro: 'pro',
};

// Defaults applied at save time if the user tapped through without selecting.
// Defaults are valid per Phase 3.6 — no validation gating the CTA.
const DEFAULT_FREQUENCY: CookingFrequency = '3-5x';
const DEFAULT_SKILL: SkillLevel = 'weeknight';

export function PreferencesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [cookingFrequency, setCookingFrequency] = useState<string | null>(null);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);

  const handleFrequency = (value: string) => {
    void Haptics.selectionAsync();
    setCookingFrequency((prev) => (prev === value ? null : value));
  };

  const handleDietary = (value: string) => {
    void Haptics.selectionAsync();
    if (value === 'None') {
      setDietaryPrefs((prev) => (prev.includes('None') ? [] : ['None']));
    } else {
      setDietaryPrefs((prev) => {
        const without = prev.filter((p) => p !== 'None' && p !== value);
        return prev.includes(value) ? without : [...without, value];
      });
    }
  };

  const handleSkill = (value: string) => {
    void Haptics.selectionAsync();
    setSkillLevel((prev) => (prev === value ? null : value));
  };

  const handleLetsCook = async () => {
    const freq =
      cookingFrequency && cookingFrequency in FREQUENCY_TO_ENUM
        ? FREQUENCY_TO_ENUM[cookingFrequency as keyof typeof FREQUENCY_TO_ENUM]
        : DEFAULT_FREQUENCY;
    const skill =
      skillLevel && skillLevel in SKILL_TO_ENUM
        ? SKILL_TO_ENUM[skillLevel as keyof typeof SKILL_TO_ENUM]
        : DEFAULT_SKILL;

    try {
      await completeOnboarding({
        cookingFrequency: freq,
        dietaryPreferences: dietaryPrefs,
        skillLevel: skill,
      });
    } catch (e) {
      // Don't block the user on a write failure — they can re-edit later via Profile.
      // Phase 3.10 sync will reconcile any local-only values.
      console.error('[onboarding] failed to persist preferences', e);
    }

    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }),
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Progress dots ────────────────────────────────────────────── */}
      <View style={[styles.dotsArea, { paddingTop: insets.top + spacing.base }]}>
        <ProgressDots currentStep={2} />
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <View style={{ height: spacing.xxl }} />

        {/* ── Headline ─────────────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <Text role="headline" align="center">Quick setup.</Text>
          <View style={{ height: spacing.xs }} />
          <Text role="caption" color="oliveDark" align="center">
            Takes 10 seconds. You can change this anytime.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── Q1: How often do you cook? ───────────────────────────────── */}
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>How often do you cook?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={cookingFrequency === opt}
                onPress={() => handleFrequency(opt)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Q2: Dietary preferences? ────────────────────────────────── */}
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>Any dietary preferences?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {DIETARY_OPTIONS.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={dietaryPrefs.includes(opt)}
                onPress={() => handleDietary(opt)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Q3: Skill level? ─────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>Skill level?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {SKILL_OPTIONS.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={skillLevel === opt}
                onPress={() => handleSkill(opt)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        {/* TODO Phase 3: consider requiring cookingFrequency before enabling */}
        <View style={styles.paddingH}>
          <Button variant="primary" label="Let's cook" onPress={handleLetsCook} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  dotsArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  paddingH: {
    paddingHorizontal: spacing.lg,
  },
  // ── Questions ─────────────────────────────────────────────────────────
  questionLabel: {
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
