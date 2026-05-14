import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AffiliateCard } from '../../components/AffiliateCard';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { RecipeImagePlaceholder } from '../../components/RecipeImagePlaceholder';
import { SectionLabel } from '../../components/SectionLabel';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { useRecipeDetail } from '../../data/hooks';
import {
  getUserPreferences,
  setMeasurementSystem,
  type MeasurementSystem,
} from '../../data/preferences';
import { convertAmount } from '../../lib/units';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { data: recipe, loading, error } = useRecipeDetail(route.params.recipeId);

  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [system, setSystem] = useState<MeasurementSystem>('imperial');

  // Load the persisted measurement preference once; default ('imperial') is
  // already the initial state so first render before this completes is fine.
  useEffect(() => {
    let cancelled = false;
    getUserPreferences().then((prefs) => {
      if (!cancelled) setSystem(prefs.measurementSystem);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleSystem = (next: MeasurementSystem) => {
    if (next === system) return;
    setSystem(next);
    setMeasurementSystem(next).catch((e) =>
      console.error('[recipeDetail] failed to persist measurement system', e),
    );
  };

  // Phase 3.11 will add a real error state. For now, route back if a phantom ID lands here.
  useEffect(() => {
    if (!loading && (error || !recipe)) {
      navigation.goBack();
    }
  }, [loading, error, recipe, navigation]);

  if (loading || !recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        {/* Hero image placeholder — full width, edge-to-edge */}
        <Skeleton height={280} width="100%" borderRadius={0} />

        {/* Header row placeholder — same shape as the real header */}
        <View style={[styles.headerRow, styles.skeletonHeaderRow]}>
          <View style={styles.headerSidePlaceholder} />
          <Skeleton height={20} width={200} />
          <View style={styles.headerSidePlaceholder} />
        </View>

        {/* Metadata */}
        <View style={[styles.section, styles.skeletonMetadata]}>
          <Skeleton height={14} width="60%" />
        </View>

        {/* CTA row + ingredients */}
        <View style={[styles.section, styles.skeletonStack]}>
          <View style={styles.skeletonCtaRow}>
            <View style={styles.skeletonCta}>
              <Skeleton height={48} borderRadius={radii.md} />
            </View>
            <View style={styles.skeletonCta}>
              <Skeleton height={48} borderRadius={radii.md} />
            </View>
          </View>
          <View style={{ height: spacing.lg }} />
          <Skeleton height={11} width="35%" />
          <View style={{ height: spacing.md }} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonIngredientRow}>
              <Skeleton height={14} width="90%" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const visibleIngredients = ingredientsExpanded
    ? recipe.ingredients
    : recipe.ingredients.slice(0, 4);
  const hasMoreIngredients = recipe.ingredients.length > 4;
  const tintKey = recipe.tintKey ?? undefined;

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero image (clean, no overlay) ─────────────────────────── */}
        <View style={styles.hero}>
          {recipe.imageUrl ? (
            <Image
              source={{ uri: recipe.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <RecipeImagePlaceholder tintKey={tintKey} />
          )}
        </View>

        {/* ── Header row (below image) ───────────────────────────────── */}
        <View style={styles.headerRow}>
          <IconButton
            icon={ChevronLeft}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            size="md"
            tint="pine"
          />
          <Text
            role="headline"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            {recipe.title}
          </Text>
          <IconButton
            icon={MoreVertical}
            onPress={() => {
              // TODO Phase 3: recipe options menu
            }}
            accessibilityLabel="Recipe options"
            size="md"
            tint="pine"
          />
        </View>

        {/* ── Metadata ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text role="caption" color="oliveDark">
            {recipe.duration} · {recipe.servings} servings{recipe.tag ? ` · ${recipe.tag}` : ''}
          </Text>
        </View>

        {/* ── Primary CTAs ───────────────────────────────────────────── */}
        <View style={styles.ctaRow}>
          <View style={styles.ctaItem}>
            <Button
              variant="secondary"
              label="Start Prep"
              onPress={() =>
                navigation.navigate('PrepMode', { recipeId: recipe.id })
              }
            />
          </View>
          <View style={styles.ctaItem}>
            <Button
              variant="primary"
              label="Start Cooking →"
              onPress={() =>
                navigation.navigate('CookMode', { recipeId: recipe.id })
              }
            />
          </View>
        </View>

        {/* ── Ingredients ────────────────────────────────────────────── */}
        <View style={[styles.section, styles.ingredientsSection]}>
          <View style={styles.ingredientsHeader}>
            <SectionLabel>INGREDIENTS</SectionLabel>
            <View style={styles.unitToggle}>
              <Pressable
                onPress={() => handleToggleSystem('imperial')}
                accessibilityRole="button"
                accessibilityLabel="Show ingredients in US units"
                accessibilityState={{ selected: system === 'imperial' }}
                hitSlop={8}
              >
                <Text
                  role="caption"
                  color={system === 'imperial' ? 'terracotta' : 'inkMuted'}
                  style={system === 'imperial' ? styles.unitActive : undefined}
                >
                  US
                </Text>
              </Pressable>
              <Text role="caption" color="inkMuted">·</Text>
              <Pressable
                onPress={() => handleToggleSystem('metric')}
                accessibilityRole="button"
                accessibilityLabel="Show ingredients in metric units"
                accessibilityState={{ selected: system === 'metric' }}
                hitSlop={8}
              >
                <Text
                  role="caption"
                  color={system === 'metric' ? 'terracotta' : 'inkMuted'}
                  style={system === 'metric' ? styles.unitActive : undefined}
                >
                  METRIC
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={{ height: spacing.md }} />

          {visibleIngredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <Text role="caption" color="oliveDark" style={styles.bullet}>·</Text>
              <Text role="body" style={styles.ingredientText}>
                {convertAmount(ing.amount, system)} {ing.name}
                {ing.prep ? `, ${ing.prep}` : ''}
              </Text>
            </View>
          ))}

          {hasMoreIngredients && (
            <>
              <View style={{ height: spacing.sm }} />
              <Pressable
                onPress={() => setIngredientsExpanded((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={
                  ingredientsExpanded
                    ? 'Show fewer ingredients'
                    : `Show all ${recipe.ingredients.length} ingredients`
                }
              >
                <Text role="caption" color="terracotta">
                  {ingredientsExpanded
                    ? 'Show fewer ↑'
                    : `Show all ${recipe.ingredients.length} →`}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Tools ──────────────────────────────────────────────────── */}
        {recipe.tools.length > 0 && (
          <View style={[styles.section, styles.toolsSection]}>
            <SectionLabel>TOOLS</SectionLabel>
            <View style={{ height: spacing.md }} />
            <View style={styles.toolsList}>
              {recipe.tools.map((tool) => (
                <AffiliateCard
                  key={tool.id}
                  productName={tool.name}
                  price={tool.price}
                  partner={tool.partner}
                  toolId={tool.id}
                  recipeId={recipe.id}
                  affiliateUrl={tool.affiliateUrl}
                  source="recipe_detail"
                />
              ))}
            </View>
            <Text role="caption" color="oliveDark" align="center" style={styles.disclosure}>
              Affiliate links help keep Mesa ad-free.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
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
    paddingBottom: spacing.xxl,
  },
  // ── Hero ────────────────────────────────────────────────────────────
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  // ── Header row (sits on Cream below the image) ──────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  // ── Body sections ───────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  ctaItem: {
    flex: 1,
  },
  ingredientsSection: {
    paddingTop: spacing.xl,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unitActive: {
    fontWeight: '600',
  },
  toolsSection: {
    paddingTop: spacing.xl,
  },
  toolsList: {
    gap: spacing.md,
  },
  disclosure: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bullet: {
    width: spacing.lg,
  },
  ingredientText: {
    flex: 1,
  },
  // ── Skeleton placeholders ───────────────────────────────────────────
  skeletonHeaderRow: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  headerSidePlaceholder: {
    width: 40,
    height: 40,
  },
  skeletonMetadata: {
    paddingTop: spacing.md,
  },
  skeletonStack: {
    paddingTop: spacing.lg,
  },
  skeletonCtaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skeletonCta: {
    flex: 1,
  },
  skeletonIngredientRow: {
    marginBottom: spacing.sm,
  },
});
