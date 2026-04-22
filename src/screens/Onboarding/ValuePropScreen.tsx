import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import type { OnboardingStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { MesaMark } from './MesaMark';
import { ProgressDots } from './ProgressDots';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

export function ValuePropScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Progress dots ────────────────────────────────────────────── */}
      <View style={[styles.dotsArea, { paddingTop: insets.top + spacing.base }]}>
        <ProgressDots currentStep={0} />
      </View>

      {/* ── Centered content ─────────────────────────────────────────── */}
      <View style={styles.content}>
        <MesaMark size={72} />
        <View style={{ height: spacing.xl }} />
        <Text role="display" align="center">
          Turn any recipe into a clean, step-by-step cooking experience.
        </Text>
        <View style={{ height: spacing.base }} />
        <Text role="caption" color="oliveDark" align="center">
          No ads. No scrolling. Just the recipe.
        </Text>
      </View>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.cta,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Button
          variant="primary"
          label="Try it — no account needed"
          onPress={() => navigation.navigate('AhaMoment')}
        />
        <View style={{ height: spacing.sm }} />
        <Text role="caption" color="oliveDark" align="center">Takes 30 seconds.</Text>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  cta: {
    paddingHorizontal: spacing.lg,
  },
});
