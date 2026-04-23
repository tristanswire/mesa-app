import * as Haptics from 'expo-haptics';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import { colors, spacing } from '../../theme';
import { ProgressDots } from './ProgressDots';

const FREQUENCY_OPTIONS = ['1-2x a week', '3-5x a week', 'Every day'] as const;
const DIETARY_OPTIONS = ['Vegetarian', 'Gluten-free', 'Dairy-free', 'None'] as const;
const SKILL_OPTIONS = ['Weeknight cook', 'Enthusiast', 'Pro'] as const;

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

  const handleLetsCook = () => {
    // TODO Phase 3: persist preferences to Supabase before resetting
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
