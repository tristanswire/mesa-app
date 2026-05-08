import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import {
  getUserPreferences,
  setCookingFrequency,
  type CookingFrequency,
} from '../../data/preferences';
import { colors, spacing } from '../../theme';
import { PreferenceEditHeader } from './PreferenceEditHeader';

const OPTIONS: { value: CookingFrequency; label: string }[] = [
  { value: '1-2x', label: '1-2x a week' },
  { value: '3-5x', label: '3-5x a week' },
  { value: 'every-day', label: 'Every day' },
];

export function CookingFrequencyScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<CookingFrequency | null>(null);

  useEffect(() => {
    getUserPreferences()
      .then((p) => setSelected(p.cookingFrequency))
      .catch(() => {});
  }, []);

  const handlePress = (value: CookingFrequency) => {
    void Haptics.selectionAsync();
    setSelected(value);
    setCookingFrequency(value).catch((e) =>
      console.error('[prefs] cooking frequency save failed', e),
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
        <PreferenceEditHeader title="Cooking frequency" />
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>How often do you cook?</Text>
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
