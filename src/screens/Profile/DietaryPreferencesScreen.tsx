import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import { getUserPreferences, setDietaryPreferences } from '../../data/preferences';
import { colors, spacing } from '../../theme';
import { PreferenceEditHeader } from './PreferenceEditHeader';

const OPTIONS = ['Vegetarian', 'Gluten-free', 'Dairy-free', 'None'] as const;

export function DietaryPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    getUserPreferences()
      .then((p) => setSelected(p.dietaryPreferences))
      .catch(() => {});
  }, []);

  const persist = (next: string[]) => {
    setSelected(next);
    setDietaryPreferences(next).catch((e) =>
      console.error('[prefs] dietary save failed', e),
    );
  };

  const handlePress = (value: string) => {
    void Haptics.selectionAsync();
    if (value === 'None') {
      // Tapping None either clears everything or toggles None off
      persist(selected.includes('None') ? [] : ['None']);
      return;
    }
    // Any non-None selection: drop None, then toggle this value
    const without = selected.filter((p) => p !== 'None' && p !== value);
    persist(selected.includes(value) ? without : [...without, value]);
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
        <PreferenceEditHeader title="Dietary preferences" />
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>Any dietary preferences?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {OPTIONS.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={selected.includes(opt)}
                onPress={() => handlePress(opt)}
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
