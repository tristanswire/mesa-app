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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateCard } from '../../components/AffiliateCard';
import { Button } from '../../components/Button';
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
import { colors, radii, shadows, spacing } from '../../theme';

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
    return <View style={{ flex: 1, backgroundColor: colors.pine }} />;
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

  const handleSave = async () => {
    void Haptics.selectionAsync();
    try {
      await setCookRating(cookId, rating);
      await setCookNotes(cookId, notes);
    } catch (e) {
      console.error('[postcook] save failed', e);
    }
    navigation.goBack();
  };

  const handleDismiss = () => {
    // Just navigate away — completeCook fires on unmount; rating/notes are not persisted.
    navigation.popToTop();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Close button — fixed above scroll ────────────────────────── */}
      <View style={[styles.closeRow, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton
          icon={X}
          tint="cream"
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
          <View style={styles.celebrationMark}>
            <Check size={28} color={colors.terracotta} strokeWidth={2} />
          </View>
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Celebration text ───────────────────────────────────────── */}
        <Text role="display" color="cream" align="center">{heroTitle}</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="creamMuted" align="center">{recipe.title}</Text>

        {isRecookWithRating && lastCook && (
          <>
            <View style={{ height: spacing.xs }} />
            <Text role="caption" color="creamMuted" align="center">
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
                    color={filled ? colors.terracotta : colors.creamMuted}
                    fill={filled ? colors.terracotta : 'none'}
                    strokeWidth={1.5}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ height: spacing.sm }} />
        <Text role="caption" color="creamMuted" align="center">How did it turn out?</Text>

        <View style={{ height: spacing.xl }} />

        {/* ── Notes textarea ─────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={notesPlaceholder}
            placeholderTextColor={colors.creamMuted}
            multiline
            style={styles.notesInput}
            textAlignVertical="top"
            accessibilityLabel="Cooking notes"
          />
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── Tools section ──────────────────────────────────────────── */}
        {displayedTools.length > 0 && (
          <>
            <View style={styles.paddingH}>
              <SectionLabel color="clay">USED IN THIS RECIPE</SectionLabel>
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
                    theme="dark"
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
        <Text role="caption" color="creamMuted" align="center">
          Affiliate links help keep Mesa ad-free.
        </Text>
      </ScrollView>

      {/* ── Save CTA — appears only when there's something new to persist ── */}
      {hasUnsavedChanges && (
        <View
          style={[
            styles.saveBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
          ]}
        >
          <Button variant="primary" label="Save" onPress={handleSave} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.pine,
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
    backgroundColor: colors.cream,
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
    backgroundColor: colors.pine,
    borderWidth: 1,
    borderColor: 'rgba(233, 221, 207, 0.2)',
    borderRadius: radii.md,
    padding: spacing.base,
    minHeight: 100,
    color: colors.cream,
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
    backgroundColor: colors.pine,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(247, 242, 234, 0.2)',
  },
});
