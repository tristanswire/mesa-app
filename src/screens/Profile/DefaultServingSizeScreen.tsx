import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from '../../components/Pill';
import { Text } from '../../components/Text';
import { getUserPreferences, setDefaultServingSize } from '../../data/preferences';
import { colors, spacing } from '../../theme';
import { PreferenceEditHeader } from './PreferenceEditHeader';

// Bounded set — most home recipes serve 2-8.
const OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export function DefaultServingSizeScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number>(4);

  useEffect(() => {
    getUserPreferences()
      .then((p) => setSelected(p.defaultServingSize))
      .catch(() => {});
  }, []);

  const handlePress = (value: number) => {
    void Haptics.selectionAsync();
    setSelected(value);
    setDefaultServingSize(value).catch((e) =>
      console.error('[prefs] serving size save failed', e),
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
        <PreferenceEditHeader title="Default serving size" />
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <Text role="body" style={styles.questionLabel}>How many people do you usually cook for?</Text>
          <View style={{ height: spacing.sm }} />
          <View style={styles.pillRow}>
            {OPTIONS.map((value) => (
              <Pill
                key={value}
                label={`${value} servings`}
                active={selected === value}
                onPress={() => handlePress(value)}
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
