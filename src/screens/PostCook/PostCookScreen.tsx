import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Check, Star, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateCard } from '../../components/AffiliateCard';
import { IconButton } from '../../components/IconButton';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { completeCook, setCookNotes, setCookRating } from '../../data/cooks';
import { useRecipeDetail } from '../../data/hooks';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing } from '../../theme';

const NOTES_DEBOUNCE_MS = 500;

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'PostCook'>;

export function PostCookScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { recipeId, cookId } = route.params;

  const { data: recipe, loading } = useRecipeDetail(recipeId);

  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest notes value held in a ref so the unmount cleanup can flush without
  // capturing a stale closure.
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    if (!loading && !recipe) {
      navigation.popToTop();
    }
  }, [loading, recipe, navigation]);

  // On unmount: flush any pending notes save and mark the cook complete.
  // Covers both the X dismiss and any future back-navigation path.
  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) {
        clearTimeout(notesDebounceRef.current);
        notesDebounceRef.current = null;
      }
      setCookNotes(cookId, notesRef.current).catch(() => {});
      completeCook(cookId).catch((e) =>
        console.error('[postcook] failed to complete cook', e),
      );
    };
  }, [cookId]);

  if (loading || !recipe) {
    return <View style={{ flex: 1, backgroundColor: colors.pine }} />;
  }

  const displayedTools = recipe.tools.slice(0, 2);

  const handleStarPress = (value: number) => {
    void Haptics.selectionAsync();
    const next = rating === value ? 0 : value;
    setRating(next);
    setCookRating(cookId, next === 0 ? null : next).catch((e) =>
      console.error('[postcook] failed to save rating', e),
    );
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      setCookNotes(cookId, text).catch((e) =>
        console.error('[postcook] failed to save notes', e),
      );
    }, NOTES_DEBOUNCE_MS);
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
          onPress={() => navigation.popToTop()}
          accessibilityLabel="Close and return to home"
        />
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
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
        <Text role="display" color="cream" align="center">Nice work.</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="creamMuted" align="center">{recipe.title}</Text>

        <View style={{ height: spacing.xl }} />

        {/* ── Star rating ────────────────────────────────────────────── */}
        <View style={styles.centerRow}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => handleStarPress(value)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
              >
                <Star
                  size={32}
                  color={value <= rating ? colors.terracotta : colors.creamMuted}
                  fill={value <= rating ? colors.terracotta : 'none'}
                  strokeWidth={1.5}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: spacing.sm }} />
        <Text role="caption" color="creamMuted" align="center">How did it turn out?</Text>

        <View style={{ height: spacing.xl }} />

        {/* ── Notes textarea ─────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <TextInput
            value={notes}
            onChangeText={handleNotesChange}
            placeholder="Any notes for next time…"
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
                    onPress={() => {}}
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
});
