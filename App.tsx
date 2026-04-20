import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from './src/theme';
import type { ColorToken, SpacingToken, TypographyRole } from './src/theme';

const COLOR_TOKENS = Object.keys(colors) as ColorToken[];
const SPACING_TOKENS = Object.keys(spacing) as SpacingToken[];

const TYPE_SAMPLES: { role: TypographyRole; sample: string }[] = [
  { role: 'display', sample: 'Mesa' },
  { role: 'headline', sample: 'Design system — smoke test' },
  { role: 'sectionLabel', sample: 'Section Label' },
  { role: 'body', sample: 'The quick brown fox jumps over the lazy dog.' },
  { role: 'caption', sample: 'Caption — metadata, timestamps, secondary info' },
  { role: 'cookModeBody', sample: 'Add the pasta and cook for 9 minutes.' },
  { role: 'cookModeStepNumber', sample: '03' },
  { role: 'cookModeIngredientChip', sample: '200g pasta' },
];

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={resolveType('display')}>Mesa</Text>
        <View style={{ height: spacing.md }} />
        <Text style={resolveType('headline')}>Design system — smoke test</Text>

        {/* Color tokens */}
        <View style={{ height: spacing.xl }} />
        <Text style={resolveType('sectionLabel')}>COLOR TOKENS</Text>
        <View style={{ height: spacing.md }} />
        <View style={styles.swatchRow}>
          {COLOR_TOKENS.map((token) => (
            <View key={token} style={styles.swatchItem}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: colors[token],
                    borderWidth: token === 'white' ? 1 : 0,
                    borderColor: colors.oat,
                  },
                ]}
              />
              <Text style={styles.swatchLabel}>{token}</Text>
            </View>
          ))}
        </View>

        {/* Typography */}
        <View style={{ height: spacing.xl }} />
        <Text style={resolveType('sectionLabel')}>TYPOGRAPHY</Text>
        {TYPE_SAMPLES.map(({ role, sample }) => {
          const spec = typography[role];
          const isCookMode = role.startsWith('cookMode');
          return (
            <View
              key={role}
              style={[
                styles.typeRow,
                isCookMode && { backgroundColor: colors.pine },
              ]}
            >
              <Text style={resolveType(role)}>{sample}</Text>
              <Text style={styles.roleLabel}>{role}</Text>
            </View>
          );
        })}

        {/* Spacing */}
        <View style={{ height: spacing.xl }} />
        <Text style={resolveType('sectionLabel')}>SPACING</Text>
        <View style={{ height: spacing.md }} />
        {SPACING_TOKENS.map((token) => {
          const value = spacing[token];
          return (
            <View key={token} style={styles.spacingRow}>
              <Text style={styles.spacingLabel}>
                {token} — {value}pt
              </Text>
              <View
                style={[
                  styles.spacingBar,
                  { height: Math.max(value, 4), width: value * 3 },
                ]}
              />
            </View>
          );
        })}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function resolveType(role: TypographyRole) {
  const spec = typography[role];
  return {
    fontFamily: spec.fontFamily,
    fontSize: spec.fontSize,
    fontWeight: spec.fontWeight as '400' | '500' | '600' | '700',
    lineHeight: spec.lineHeight,
    letterSpacing: spec.letterSpacing,
    color: colors[spec.color],
    textTransform: spec.textTransform,
  };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
  },
  swatchLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.oliveDark,
    textAlign: 'center',
  },
  typeRow: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.sm,
    gap: 2,
  },
  roleLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.clay,
    marginTop: 2,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  spacingLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.oliveDark,
    width: 110,
  },
  spacingBar: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    flex: 1,
    marginLeft: spacing.md,
  },
});
