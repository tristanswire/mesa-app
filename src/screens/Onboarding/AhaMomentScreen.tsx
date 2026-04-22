import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import type { OnboardingStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';
import { MesaMark } from './MesaMark';
import { ProgressDots } from './ProgressDots';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

function InlineMiniChip({ label }: { label: string }) {
  return (
    <View style={styles.miniChip}>
      <RNText style={styles.miniChipLabel}>{label}</RNText>
    </View>
  );
}

export function AhaMomentScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const goNext = () => navigation.navigate('Preferences');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Progress dots ────────────────────────────────────────────── */}
      <View style={[styles.dotsArea, { paddingTop: insets.top + spacing.base }]}>
        <ProgressDots currentStep={1} />
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={{ height: spacing.xxl }} />

        <Text role="headline" align="center" style={styles.paddingH}>
          Watch what Mesa does.
        </Text>

        <View style={{ height: spacing.xl }} />

        {/* ── Before/After card ────────────────────────────────────────── */}
        <View style={styles.comparisonCard}>
          {/* BEFORE column — Oat, single cluttered stack */}
          <View style={styles.beforeColumn}>
            <View>
              <Text role="caption" style={styles.beforeLabel}>BEFORE</Text>
              <View style={styles.beforeContent}>
                <View style={[styles.bar, { width: '80%' }]} />
                <View style={[styles.bar, { width: '65%' }]} />
                <View style={styles.adBlock}>
                  <RNText style={styles.adText}>AD</RNText>
                </View>
                <View style={[styles.bar, { width: '70%' }]} />
                <View style={[styles.bar, { width: '55%' }]} />
                <View style={styles.adBlock}>
                  <RNText style={styles.adText}>AD</RNText>
                </View>
                <View style={[styles.bar, { width: '75%' }]} />
                <View style={[styles.bar, { width: '60%' }]} />
              </View>
            </View>
            <Text role="caption" color="oliveDark">Any recipe site</Text>
          </View>

          {/* AFTER column — two stacked containers */}
          <View style={styles.afterColumn}>
            {/* Top container — Cream, Recipe Detail feel */}
            <View style={styles.afterTop}>
              <Text role="caption" style={styles.afterLabel}>AFTER</Text>

              <View style={styles.afterTopContent}>
                <RNText style={styles.recipeTitle}>Harissa Chicken</RNText>
                <View style={styles.ingredientList}>
                  <Text role="caption" color="oliveDark">2 tbsp olive oil</Text>
                  <Text role="caption" color="oliveDark">3 cloves garlic</Text>
                  <Text role="caption" color="oliveDark">1 lb chicken thighs</Text>
                </View>
              </View>

              <View style={styles.mesaFooter}>
                <MesaMark size={20} />
                <Text role="caption" style={styles.mesaFooterLabel}>Mesa</Text>
              </View>
            </View>

            {/* Bottom container — Pine, Cook Mode step card fragment */}
            <View style={styles.afterBottom}>
              <RNText style={styles.stepLabel}>STEP 1</RNText>
              <View style={styles.stepTextRow}>
                <RNText style={styles.stepBody}>Heat </RNText>
                <InlineMiniChip label="2 tbsp olive oil" />
                <RNText style={styles.stepBody}> until fragrant.</RNText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Sparkles separator ───────────────────────────────────────── */}
        <View style={styles.centerRow}>
          <Sparkles size={24} color={colors.terracotta} strokeWidth={1.5} />
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── CTAs ─────────────────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <Button
            variant="primary"
            label="Import your first recipe"
            onPress={goNext}
          />
        </View>

        <View style={{ height: spacing.base }} />
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.centerRow, pressed && { opacity: 0.6 }]}
        >
          <Text role="caption" color="terracotta" align="center">
            Use our sample recipe instead →
          </Text>
        </Pressable>
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
  centerRow: {
    alignItems: 'center',
  },
  // ── Comparison card ───────────────────────────────────────────────────
  comparisonCard: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    overflow: 'hidden',
    alignItems: 'stretch',
    marginHorizontal: spacing.lg,
  },
  // ── BEFORE column ─────────────────────────────────────────────────────
  beforeColumn: {
    flex: 1,
    padding: spacing.base,
    backgroundColor: colors.oat,
    justifyContent: 'space-between',
  },
  beforeLabel: {
    letterSpacing: 1,
    color: colors.oliveDark,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  beforeContent: {
    gap: spacing.sm,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(31, 28, 25, 0.15)',
  },
  adBlock: {
    backgroundColor: 'rgba(31, 28, 25, 0.2)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  adText: {
    fontFamily: 'Inter_700Bold',
    color: colors.cream,
    fontSize: 10,
    lineHeight: 14,
  },
  // ── AFTER column ──────────────────────────────────────────────────────
  afterColumn: {
    flex: 1,
  },
  // Top — Cream, Recipe Detail feel
  afterTop: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  afterLabel: {
    letterSpacing: 1,
    fontWeight: '600',
    color: colors.terracotta,
    marginBottom: spacing.sm,
  },
  afterTopContent: {
    gap: spacing.sm,
  },
  recipeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  ingredientList: {
    gap: 2,
  },
  mesaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.base,
  },
  mesaFooterLabel: {
    fontWeight: '600',
    color: colors.ink,
  },
  // Bottom — Pine, Cook Mode step card fragment
  afterBottom: {
    backgroundColor: colors.pine,
    padding: spacing.base,
  },
  stepLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: colors.clay,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stepTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  stepBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.cream,
  },
  // Mini chip — onboarding-only, not the Phase 1 IngredientChip
  miniChip: {
    backgroundColor: colors.oat,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
    transform: [{ translateY: 3 }],
  },
  miniChipLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.pine,
  },
});
