import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Check, Star, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateCard } from '../../components/AffiliateCard';
import { Button, type ButtonProps } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import {
  completeCook,
  getMostRecentCompletedCook,
  setCookNotes,
  setCookRating,
  type LastCookSummary,
} from '../../data/cooks';
import { useRecipeDetail } from '../../data/hooks';
import type { MainStackParamList } from '../../navigation/types';
import type { ColorToken } from '../../theme';
import { colors, radii, shadows, spacing } from '../../theme';


/**
 * Post-Cook follows system appearance, mirroring Cook Mode's light variant so
 * finishing a cook doesn't flash a different surface than the one just used.
 *
 * Light values are chosen for contrast, not symmetry: dark mode's muted
 * secondary text (`creamMuted`, 45% cream on Pine) has no compliant analog on
 * Cream — `inkMuted` lands near 2.3:1 — so light mode uses Olive Dark (6.72:1
 * on Cream) for secondary text and for the unfilled stars, which as 32pt
 * non-text UI still need 3:1.
 */
type PostCookTheme = {
  background: string;
  statusBarStyle: 'light' | 'dark';
  closeTint: ColorToken;
  headingColor: ColorToken;
  secondaryColor: ColorToken;
  sectionLabelColor: ColorToken;
  /** Unfilled star + notes placeholder. Filled stars are Terracotta in both. */
  mutedIcon: string;
  celebrationBg: string;
  notesBg: string;
  notesBorder: string;
  notesText: string;
  cardTheme: 'light' | 'dark';
  barBorder: string;
  // Same rule as Cook Mode (MESA-014): `cookPrimary` is a Cream fill built for
  // Pine, so on a Cream background it would render invisible.
  primaryButtonVariant: ButtonProps['variant'];
};

const POST_COOK_THEMES: Record<'dark' | 'light', PostCookTheme> = {
  dark: {
    background: colors.pine,
    statusBarStyle: 'light',
    closeTint: 'cream',
    headingColor: 'cream',
    secondaryColor: 'creamMuted',
    sectionLabelColor: 'oat',
    mutedIcon: colors.creamMuted,
    celebrationBg: colors.cream,
    notesBg: colors.pine,
    notesBorder: 'rgba(233, 221, 207, 0.2)',
    notesText: colors.cream,
    cardTheme: 'dark',
    barBorder: 'rgba(247, 242, 234, 0.2)',
    primaryButtonVariant: 'cookPrimary',
  },
  light: {
    background: colors.cream,
    statusBarStyle: 'dark',
    closeTint: 'oliveDark',
    headingColor: 'ink',
    secondaryColor: 'oliveDark',
    sectionLabelColor: 'oliveDark',
    mutedIcon: colors.oliveDark,
    // Oat keeps the badge visible against Cream; the check stays Terracotta.
    celebrationBg: colors.oat,
    notesBg: colors.oat,
    notesBorder: 'rgba(31, 28, 25, 0.1)',
    notesText: colors.ink,
    cardTheme: 'light',
    barBorder: 'rgba(31, 28, 25, 0.1)',
    primaryButtonVariant: 'primary',
  },
};

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'PostCook'>;

// Quick relative-date formatter — no external dep needed for this one string.
function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'before';
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return 'last month';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return 'over a year ago';
}

export function PostCookScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { recipeId, cookId } = route.params;

  // System appearance only — Post-Cook has no in-screen toggle, and Cook Mode's
  // manual override lives in that screen's state and doesn't survive the
  // navigation here (see flags).
  const systemScheme = useColorScheme();
  const tc = POST_COOK_THEMES[systemScheme === 'light' ? 'light' : 'dark'];

  const { data: recipe, loading } = useRecipeDetail(recipeId);

  const [lastCook, setLastCook] = useState<LastCookSummary>(null);
  const [lastCookLoaded, setLastCookLoaded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [initialRating, setInitialRating] = useState<number | null>(null);
  const [initialNotes, setInitialNotes] = useState('');

  // Initial load: figure out if this is a re-cook with prior rating.
  // The current in-flight cook still has completedAt: null (we only call
  // completeCook on unmount), so the helper's isNotNull filter excludes it.
  useEffect(() => {
    getMostRecentCompletedCook(recipeId)
      .then((prev) => {
        if (prev && prev.cookId !== cookId) {
          setLastCook(prev);
          setRating(prev.rating);
          setInitialRating(prev.rating);
          const prevNotes = prev.notes ?? '';
          setNotes(prevNotes);
          setInitialNotes(prevNotes);
        }
      })
      .catch((e) => console.error('[postcook] failed to load prior cook', e))
      .finally(() => setLastCookLoaded(true));
  }, [recipeId, cookId]);

  useEffect(() => {
    if (!loading && !recipe) {
      navigation.popToTop();
    }
  }, [loading, recipe, navigation]);

  // Mark this cook as completed on unmount. Rating/notes are saved only via
  // the explicit Save button — X dismisses without persisting them.
  useEffect(() => {
    return () => {
      completeCook(cookId).catch((e) =>
        console.error('[postcook] failed to complete cook', e),
      );
    };
  }, [cookId]);

  if (loading || !recipe) {
    return <View style={{ flex: 1, backgroundColor: tc.background }} />;
  }

  const displayedTools = recipe.tools.slice(0, 2);
  const isRecookWithRating =
    lastCookLoaded && lastCook !== null && lastCook.rating !== null;
  const heroTitle = isRecookWithRating ? 'Welcome back.' : 'Nice work.';
  const notesPlaceholder = isRecookWithRating
    ? 'Update your notes…'
    : 'Any notes for next time…';
  const hasUnsavedChanges =
    rating !== initialRating || notes.trim() !== initialNotes.trim();

  const handleStarPress = (value: number) => {
    void Haptics.selectionAsync();
    setRating((prev) => (prev === value ? null : value));
  };

  // Finishing the cook (save or dismiss) resets the Main stack to a single
  // Tabs route with Home selected. Reset (not goBack) so the user can't swipe
  // back into RecipeDetail / CookMode — the cook has ended.
  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Tabs',
          state: {
            index: 0,
            routes: [{ name: 'Home' }],
          },
        },
      ],
    });
  };

  const handleSave = async () => {
    void Haptics.selectionAsync();
    try {
      await setCookRating(cookId, rating);
      await setCookNotes(cookId, notes);
    } catch (e) {
      console.error('[postcook] save failed', e);
    }
    goHome();
  };

  const handleDismiss = () => {
    // completeCook fires on unmount; rating/notes are not persisted on dismiss.
    goHome();
  };

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      <StatusBar style={tc.statusBarStyle} />

      {/* ── Close button — fixed above scroll ────────────────────────── */}
      <View style={[styles.closeRow, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton
          icon={X}
          tint={tc.closeTint}
          size="md"
          onPress={handleDismiss}
          accessibilityLabel="Close without saving"
        />
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              insets.bottom + (hasUnsavedChanges ? spacing.xxl * 2 : spacing.xxl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Space below close button */}
        <View style={{ height: spacing.xxl }} />

        {/* ── Celebration mark ───────────────────────────────────────── */}
        <View style={styles.centerRow}>
          <View style={[styles.celebrationMark, { backgroundColor: tc.celebrationBg }]}>
            <Check size={28} color={colors.terracotta} strokeWidth={2} />
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Celebration text ───────────────────────────────────────── */}
        <Text role="display" color={tc.headingColor} align="center">{heroTitle}</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color={tc.secondaryColor} align="center">{recipe.title}</Text>

        {isRecookWithRating && lastCook && (
          <>
            <View style={{ height: spacing.xs }} />
            <Text role="caption" color={tc.secondaryColor} align="center">
              Last rated {formatRelativeDate(lastCook.completedAt)}
            </Text>
          </>
        )}

        <View style={{ height: spacing.xl }} />

        {/* ── Star rating ────────────────────────────────────────────── */}
        <View style={styles.centerRow}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = rating !== null && value <= rating;
              return (
                <Pressable
                  key={value}
                  onPress={() => handleStarPress(value)}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star
                    size={32}
                    color={filled ? colors.terracotta : tc.mutedIcon}
                    fill={filled ? colors.terracotta : 'none'}
                    strokeWidth={1.5}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: spacing.sm }} />
        <Text role="caption" color={tc.secondaryColor} align="center">How did it turn out?</Text>

        <View style={{ height: spacing.xl }} />

        {/* ── Notes textarea ─────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={notesPlaceholder}
            placeholderTextColor={tc.mutedIcon}
            multiline
            style={[
              styles.notesInput,
              { backgroundColor: tc.notesBg, borderColor: tc.notesBorder, color: tc.notesText },
            ]}
            textAlignVertical="top"
            accessibilityLabel="Cooking notes"
          />
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── Tools section ──────────────────────────────────────────── */}
        {displayedTools.length > 0 && (
          <>
            <View style={styles.paddingH}>
              <SectionLabel color={tc.sectionLabelColor}>USED IN THIS RECIPE</SectionLabel>
            </View>
            <View style={{ height: spacing.md }} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.toolsCarouselOuter}
              contentContainerStyle={styles.toolsCarousel}
            >
              {displayedTools.map((tool) => (
                <View key={tool.id} style={styles.toolCardWrap}>
                  <AffiliateCard
                    productName={tool.name}
                    price={tool.price}
                    partner={tool.partner}
                    theme={tc.cardTheme}
                    toolId={tool.id}
                    recipeId={recipe.id}
                    affiliateUrl={tool.affiliateUrl}
                    source="post_cook"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={{ height: spacing.xl }} />
          </>
        )}

        {/* ── Affiliate disclosure ───────────────────────────────────── */}
        <Text role="caption" color={tc.secondaryColor} align="center">
          Affiliate links help keep Mesa ad-free.
        </Text>
      </ScrollView>

      {/* ── Save CTA — appears only when there's something new to persist ── */}
      {hasUnsavedChanges && (
        <View
          style={[
            styles.saveBar,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg,
              backgroundColor: tc.background,
              borderTopColor: tc.barBorder,
            },
          ]}
        >
          <Button variant={tc.primaryButtonVariant} label="Save" onPress={handleSave} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // ── Close button ────────────────────────────────────────────────────
  closeRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  // ── Scroll ──────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  paddingH: {
    paddingHorizontal: spacing.lg,
  },
  // ── Celebration ─────────────────────────────────────────────────────
  centerRow: {
    alignItems: 'center',
  },
  celebrationMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  // ── Stars ───────────────────────────────────────────────────────────
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // ── Notes ───────────────────────────────────────────────────────────
  notesInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.base,
    minHeight: 100,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  // ── Tools carousel ──────────────────────────────────────────────────
  toolsCarouselOuter: {},
  toolsCarousel: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  toolCardWrap: {
    width: 280,
  },
  // ── Save bar ────────────────────────────────────────────────────────
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
