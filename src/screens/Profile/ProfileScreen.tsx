import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import type { MainStackParamList, RootStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

// Profile needs two nav scopes: Main stack for Showcase, Root for Onboarding
type MainNav = NativeStackNavigationProp<MainStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_STATS = {
  name: 'Tristan',
  tagline: 'Home cook · 24 recipes saved',
  recipes: 24,
  collections: 6,
  thisWeek: 3,
};

function SettingRow({
  label,
  onPress,
  isLast = false,
}: {
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text role="body">{label}</Text>
      <ChevronRight size={20} color={colors.oliveDark} strokeWidth={1.5} />
    </Pressable>
  );
}

export function ProfileScreen() {
  const mainNav = useNavigation<MainNav>();
  const rootNav = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
      >
        {/* ── Profile header ───────────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <View style={styles.avatar}>
            <User size={32} color={colors.oliveDark} strokeWidth={1.5} />
          </View>
          <View style={{ height: spacing.md }} />
          <Text role="headline" align="center">{MOCK_STATS.name}</Text>
          <View style={{ height: spacing.xs }} />
          <Text role="caption" color="oliveDark" align="center">{MOCK_STATS.tagline}</Text>
        </View>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <View style={styles.statsContainer}>
          <View style={styles.statCol}>
            <Text role="headline" align="center" style={styles.statNumber}>
              {String(MOCK_STATS.recipes)}
            </Text>
            <Text role="caption" color="oliveDark" align="center">Recipes</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text role="headline" align="center" style={styles.statNumber}>
              {String(MOCK_STATS.collections)}
            </Text>
            <Text role="caption" color="oliveDark" align="center">Collections</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text role="headline" align="center" style={styles.statNumber}>
              {String(MOCK_STATS.thisWeek)}
            </Text>
            <Text role="caption" color="oliveDark" align="center">This week</Text>
          </View>
        </View>

        {/* ── PREFERENCES ─────────────────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <SectionLabel>PREFERENCES</SectionLabel>
        </View>
        <View style={{ height: spacing.md }} />
        <View style={styles.paddingH}>
          <SettingRow
            label="Dietary preferences"
            onPress={() => { /* TODO Phase 3: dietary preferences detail */ }}
          />
          <SettingRow
            label="Default serving size"
            onPress={() => { /* TODO Phase 3: serving size picker */ }}
            isLast
          />
        </View>

        {/* ── ACCOUNT ─────────────────────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <View style={styles.paddingH}>
          <SectionLabel>ACCOUNT</SectionLabel>
        </View>
        <View style={{ height: spacing.md }} />
        <View style={styles.paddingH}>
          <SettingRow
            label="Manage subscription"
            onPress={() => { /* TODO Phase 3: subscription decision */ }}
            isLast
          />
        </View>

        {/* ── Sign out ─────────────────────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <Pressable
          onPress={() => { /* TODO Phase 3: sign out via Supabase */ }}
          style={({ pressed }) => [styles.centerLink, pressed && { opacity: 0.6 }]}
        >
          <Text role="body" color="terracotta" align="center">Sign out</Text>
        </Pressable>

        {/* ── Debug links (Phase 2 only) ───────────────────────────── */}
        <View style={{ height: spacing.lg }} />
        <Pressable
          onPress={() => mainNav.navigate('Showcase')}
          style={({ pressed }) => [styles.centerLink, pressed && { opacity: 0.6 }]}
        >
          <Text role="caption" color="oliveDark" align="center">Component Showcase</Text>
        </Pressable>

        <View style={{ height: spacing.sm }} />
        {/* Temporary — removed in Phase 3 when first-launch gate ships */}
        <Pressable
          onPress={() => rootNav.navigate('Onboarding')}
          style={({ pressed }) => [styles.centerLink, pressed && { opacity: 0.6 }]}
        >
          <Text role="caption" color="oliveDark" align="center">Open Onboarding (debug)</Text>
        </Pressable>
      </ScrollView>
    </>
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
  // ── Header ──────────────────────────────────────────────────────────
  headerBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Stats ───────────────────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.oat,
    borderRadius: radii.lg,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(31, 28, 25, 0.1)',
  },
  // ── Setting rows ────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
  },
  // ── Links ───────────────────────────────────────────────────────────
  centerLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
