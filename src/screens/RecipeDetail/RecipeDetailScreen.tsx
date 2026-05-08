import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { RecipeImagePlaceholder } from '../../components/RecipeImagePlaceholder';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { useRecipeDetail } from '../../data/hooks';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { data: recipe, loading, error } = useRecipeDetail(route.params.recipeId);

  // Phase 3.11 will add a real error state. For now, route back if a phantom ID lands here.
  useEffect(() => {
    if (!loading && (error || !recipe)) {
      navigation.goBack();
    }
  }, [loading, error, recipe, navigation]);

  if (loading || !recipe) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  const previewIngredients = recipe.ingredients.slice(0, 4);
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
