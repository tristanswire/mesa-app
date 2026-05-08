import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import {
  getUserPreferences,
  setSkillLevel,
  type SkillLevel,
} from '../../data/preferences';
import { colors, spacing } from '../../theme';
import { PreferenceEditHeader } from './PreferenceEditHeader';

const OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'weeknight', label: 'Weeknight cook' },
  { value: 'enthusiast', label: 'Enthusiast' },
  { value: 'pro', label: 'Pro' },
];

export function SkillLevelScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SkillLevel | null>(null);

  useEffect(() => {
    getUserPreferences()
      .then((p) => setSelected(p.skillLevel))
      .catch(() => {});
  }, []);

  const handlePress = (value: SkillLevel) => {
    void Haptics.selectionAsync();
    setSelected(value);
    setSkillLevel(value).catch((e) =>
      console.error('[prefs] skill level save failed', e),
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.base, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <PreferenceEditHeader title="Skill level" />
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>Skill level?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={selected === opt.value}
                onPress={() => handlePress(opt.value)}
              />
            ))}
          </View>
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
  scrollContent: {
    paddingHorizontal: 0,
  },
  paddingH: {
    paddingHorizontal: spacing.lg,
  },
  questionLabel: {
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
