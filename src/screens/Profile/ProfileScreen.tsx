import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { User } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionLabel } from '../../components/SectionLabel';
import { SettingRow } from '../../components/SettingRow';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { useProfileStats, useUserPreferences } from '../../data/hooks';
import {
  setShowRatingPrompt,
  setTimerSoundEnabled,
  type CookingFrequency,
  type SkillLevel,
} from '../../data/preferences';
import { SUPPORT_EMAIL } from '../../lib/constants';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// Profile name + tagline are still mocked — Phase 3.10 will pull from auth/profile.
// Collections is hardcoded to 0 until the feature ships (Phase 4 deferred).
const PROFILE_HEADER = {
  name: 'Tristan',
  tagline: 'Home cook',
};

const FREQUENCY_LABELS: Record<CookingFrequency, string> = {
  '1-2x': '1-2x a week',
  '3-5x': '3-5x a week',
  'every-day': 'Every day',
};

const SKILL_LABELS: Record<SkillLevel, string> = {
  weeknight: 'Weeknight cook',
  enthusiast: 'Enthusiast',
  pro: 'Pro',
};

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const stats = useProfileStats();
  const { data: prefs, refresh: refreshPrefs } = useUserPreferences();

  // Refresh prefs whenever Profile regains focus — covers returning from any
  // of the four edit screens.
  useFocusEffect(
    useCallback(() => {
      refreshPrefs();
    }, [refreshPrefs]),
  );

  const dietaryDisplay =
    prefs == null
      ? '—'
      : prefs.dietaryPreferences.length === 0
        ? 'None'
        : prefs.dietaryPreferences.join(', ');

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
          <Text role="headline" align="center">{PROFILE_HEADER.name}</Text>
          <View style={{ height: spacing.xs }} />
          <Text role="caption" color="oliveDark" align="center">{PROFILE_HEADER.tagline}</Text>
        </View>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <View style={styles.statsContainer}>
          <View style={styles.statCol}>
            {stats.ready ? (
              <Text role="headline" align="center" style={styles.statNumber}>
                {String(stats.uniqueRecipes)}
              </Text>
            ) : (
              <View style={styles.statSkeleton}>
                <Skeleton height={28} width={40} />
              </View>
            )}
            <Text role="caption" color="oliveDark" align="center">Recipes</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            {stats.ready ? (
              <Text role="headline" align="center" style={styles.statNumber}>
                0
              </Text>
            ) : (
              <View style={styles.statSkeleton}>
                <Skeleton height={28} width={40} />
              </View>
            )}
            <Text role="caption" color="oliveDark" align="center">Collections</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            {stats.ready ? (
              <Text role="headline" align="center" style={styles.statNumber}>
                {String(stats.cooksThisWeek)}
              </Text>
            ) : (
              <View style={styles.statSkeleton}>
                <Skeleton height={28} width={40} />
              </View>
            )}
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
            label="Cooking frequency"
            valueText={prefs?.cookingFrequency ? FREQUENCY_LABELS[prefs.cookingFrequency] : 'Not set'}
            onPress={() => navigation.navigate('CookingFrequency')}
          />
          <SettingRow
            label="Dietary preferences"
            valueText={dietaryDisplay}
            onPress={() => navigation.navigate('DietaryPreferences')}
          />
          <SettingRow
            label="Skill level"
            valueText={prefs?.skillLevel ? SKILL_LABELS[prefs.skillLevel] : 'Not set'}
            onPress={() => navigation.navigate('SkillLevel')}
          />
          <SettingRow
            label="Default serving size"
            valueText={`${prefs?.defaultServingSize ?? 4} servings`}
            onPress={() => navigation.navigate('DefaultServingSize')}
          />
          <SettingRow
            variant="toggle"
            label="Timer sound"
            value={prefs?.timerSoundEnabled ?? true}
            onValueChange={async (next) => {
              try {
                await setTimerSoundEnabled(next);
                refreshPrefs();
              } catch (e) {
                console.error('[profile] timer sound save failed', e);
              }
            }}
          />
          <SettingRow
            variant="toggle"
            label="Show rating prompt after cooking"
            value={prefs?.showRatingPrompt ?? true}
            onValueChange={async (next) => {
              try {
                await setShowRatingPrompt(next);
                refreshPrefs();
              } catch (e) {
                console.error('[profile] show rating prompt save failed', e);
              }
            }}
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
            label="Contact support"
            onPress={() => {
              const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Mesa support')}`;
              Linking.openURL(url).catch((e) =>
                console.error('[profile] failed to open mail composer', e),
              );
            }}
            isLast
          />
        </View>

        {/* ── Debug links — dev builds only; route stays registered ── */}
        {__DEV__ && (
          <>
            <View style={{ height: spacing.lg }} />
            <Pressable
              onPress={() => navigation.navigate('Showcase')}
              style={({ pressed }) => [styles.centerLink, pressed && { opacity: 0.6 }]}
            >
              <Text role="caption" color="oliveDark" align="center">Component Showcase</Text>
            </Pressable>
          </>
        )}
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
  // Match the headline's vertical footprint so the row doesn't shift
  // when real numbers replace the skeleton.
  statSkeleton: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(31, 28, 25, 0.1)',
  },
  // ── Links ───────────────────────────────────────────────────────────
  centerLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
