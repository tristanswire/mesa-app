import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { RecipeImagePlaceholder } from '../../components/RecipeImagePlaceholder';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing } from '../../theme';
import { getMockRecipeOrFallback } from '../../mocks/recipes';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const recipe = getMockRecipeOrFallback(route.params.recipeId);
  const previewIngredients = recipe.ingredients.slice(0, 4);

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero image ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <RecipeImagePlaceholder tintKey={recipe.tintKey} />

          {/* Overlay: back | title chip | overflow */}
          <View
            style={[
              styles.heroOverlay,
              { paddingTop: insets.top + spacing.base },
            ]}
          >
            <View style={styles.heroIconWrap}>
              <IconButton
                icon={ChevronLeft}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                size="md"
              />
            </View>

            <View style={styles.titleChip}>
              <Text
                role="caption"
                color="ink"
                numberOfLines={1}
                style={styles.titleChipText}
              >
                {recipe.title}
              </Text>
            </View>

            <View style={styles.heroIconWrap}>
              <IconButton
                icon={MoreVertical}
                onPress={() => {
                  // TODO Phase 3: recipe options menu
                }}
                accessibilityLabel="Recipe options"
                size="md"
              />
            </View>
          </View>
        </View>

        {/* ── Metadata ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text role="caption" color="oliveDark">
            {recipe.duration} · {recipe.servings} servings · {recipe.tag}
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
          <SectionLabel>INGREDIENTS</SectionLabel>
          <View style={{ height: spacing.md }} />

          {previewIngredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <Text role="caption" color="oliveDark" style={styles.bullet}>·</Text>
              <Text role="body" style={styles.ingredientText}>
                {ing.amount} {ing.name}
                {ing.prep ? `, ${ing.prep}` : ''}
              </Text>
            </View>
          ))}

          <View style={{ height: spacing.sm }} />
          {/* TODO Phase 3: expand/collapse full ingredient list */}
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel={`Show all ${recipe.ingredients.length} ingredients`}
          >
            <Text role="caption" color="terracotta">
              Show all {recipe.ingredients.length} →
            </Text>
          </Pressable>
        </View>

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
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  heroIconWrap: {
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    ...shadows.card,
  },
  titleChip: {
    flex: 1,
    backgroundColor: colors.oat,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    ...shadows.card,
  },
  titleChipText: {
    fontWeight: '600',
  },
  // ── Body sections ───────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
});
