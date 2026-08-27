import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Camera, ChevronLeft, ExternalLink, MoreVertical, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActionSheet, type ActionSheetItem } from '../../components/ActionSheet';
import { AffiliateCard } from '../../components/AffiliateCard';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { RecipeImagePlaceholder } from '../../components/RecipeImagePlaceholder';
import { SectionLabel } from '../../components/SectionLabel';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { CategoryPickerSheet } from '../../components/CategoryPickerSheet';
import { useRecipeDetail } from '../../data/hooks';
import {
  getUserPreferences,
  setMeasurementSystem,
  type MeasurementSystem,
} from '../../data/preferences';
import {
  deleteRecipe,
  RECIPE_CATEGORY_LABELS,
  setRecipeCategory,
  setRecipePhoto,
  type RecipeCategory,
} from '../../data/recipes';
import { captureRecipePhotoFile, type PhotoSource } from '../../lib/photoImport';
import { convertAmount, formatQuantity, scaleAmount } from '../../lib/units';
import type { MainStackParamList } from '../../navigation/types';
import { ServingScaleControl } from './ServingScaleControl';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { data: recipe, loading, error } = useRecipeDetail(route.params.recipeId);

  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [system, setSystem] = useState<MeasurementSystem>('imperial');
  // Session-only serving multiplier. Lives in screen state and rides the
  // navigation params into the cook flow — never written to the recipe. It
  // resets when this screen unmounts, i.e. when the user leaves the recipe.
  const [scale, setScale] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Reset when the recipe id changes so a fresh load gets one fair shot at
  // fetching the image before we decide it failed.
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  useEffect(() => {
    setHeroImageFailed(false);
  }, [recipe?.id]);
  // Mirrors the persisted recipe.category so the row updates instantly on save
  // without round-tripping through useRecipeDetail's one-shot fetch.
  const [category, setCategory] = useState<RecipeCategory | null>(null);

  useEffect(() => {
    if (recipe) setCategory(recipe.category);
  }, [recipe?.id, recipe?.category]);

  // Same mirror pattern as `category`: useRecipeDetail is a one-shot fetch, so
  // a newly saved photo needs local state to appear without leaving the screen.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    if (recipe) setImageUrl(recipe.imageUrl);
  }, [recipe?.id, recipe?.imageUrl]);

  const handlePhotoPick = async (recipeId: string, source: PhotoSource) => {
    const captured = await captureRecipePhotoFile(source);
    if (captured.status === 'cancelled') return;
    if (captured.status === 'error') {
      Alert.alert("Couldn't add photo", captured.message);
      return;
    }

    setSavingPhoto(true);
    try {
      const uri = await setRecipePhoto(recipeId, captured.uri);
      // A fresh filename per save, so the Image cache can't serve the old one.
      setImageUrl(uri);
      setHeroImageFailed(false);
    } catch (e) {
      console.error('[recipeDetail] failed to save photo', e);
      Alert.alert("Couldn't add photo", 'Something went wrong. Please try again.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const showPhotoOptions = (recipeId: string) => {
    if (savingPhoto) return;
    // Mirrors ImportScreen's sheet. Non-iOS falls back to the library picker
    // rather than doing nothing.
    if (Platform.OS !== 'ios') {
      void handlePhotoPick(recipeId, 'library');
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Choose from Library'],
        cancelButtonIndex: 0,
        title: 'Recipe photo',
      },
      (buttonIndex) => {
        if (buttonIndex === 1) void handlePhotoPick(recipeId, 'camera');
        else if (buttonIndex === 2) void handlePhotoPick(recipeId, 'library');
      },
    );
  };

  const handleCategoryChange = (next: RecipeCategory | null) => {
    if (!recipe) return;
    if (next === category) return;
    setCategory(next);
    setRecipeCategory(recipe.id, next).catch((e) =>
      console.error('[recipeDetail] failed to persist category', e),
    );
  };

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

  const handleViewOriginal = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Can't open link", 'This recipe’s source link is no longer valid.');
      }
    } catch (e) {
      console.error('[recipeDetail] openURL failed', e);
      Alert.alert("Can't open link", 'This recipe’s source link is no longer valid.');
    }
  };

  const handleDelete = (recipeId: string) => {
    Alert.alert('Delete this recipe?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRecipe(recipeId)
            .then(() => {
              // Land on the library rather than whichever screen pushed this
              // one — Home's hero could still be pointing at the deleted recipe
              // for a frame while its live query catches up.
              navigation.navigate('Tabs', { screen: 'Recipes' });
            })
            .catch((e) => {
              console.error('[recipeDetail] delete failed', e);
              Alert.alert('Delete failed', 'Something went wrong. Please try again.');
            });
        },
      },
    ]);
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
  const showHeroPlaceholder = !imageUrl || heroImageFailed;
  const baseServings = recipe.servings > 0 ? recipe.servings : 1;
  const isScaled = scale !== 1;
  const scaledServings = baseServings * scale;
  const servingsLabel = `${formatQuantity(scaledServings)} serving${
    Math.abs(scaledServings - 1) < 1e-9 ? '' : 's'
  }${isScaled ? ` · scaled from ${recipe.servings}` : ''}`;
  // Scale before converting: scaleAmount emits fractions ("¾ cup") that
  // convertAmount reads back, so the two compose in this order only.
  const displayAmount = (amount: string) => convertAmount(scaleAmount(amount, scale), system);
  // Max 2 affiliate cards per surface (matches Prep Mode and PostCook).
  const displayedTools = recipe.tools.slice(0, 2);

  // "View Original" only exists for imported recipes — manual/photo ones have
  // no sourceUrl to open.
  const menuItems: ActionSheetItem[] = [
    ...(recipe.sourceUrl
      ? [
          {
            label: 'View Original',
            icon: ExternalLink,
            onPress: () => void handleViewOriginal(recipe.sourceUrl!),
          },
        ]
      : []),
    {
      label: 'Change Photo',
      icon: Camera,
      onPress: () => showPhotoOptions(recipe.id),
    },
    {
      label: 'Delete Recipe',
      icon: Trash2,
      destructive: true,
      onPress: () => handleDelete(recipe.id),
    },
  ];

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
          {showHeroPlaceholder ? (
            <Pressable
              onPress={() => showPhotoOptions(recipe.id)}
              disabled={savingPhoto}
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel="Add a photo for this recipe"
            >
              <RecipeImagePlaceholder showAddPhoto />
            </Pressable>
          ) : (
            <Image
              source={{ uri: imageUrl! }}
              onError={() => setHeroImageFailed(true)}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}

          {savingPhoto && (
            <View style={styles.heroSaving} pointerEvents="none">
              <ActivityIndicator color={colors.terracotta} />
            </View>
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
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Recipe options"
            size="md"
            tint="pine"
          />
        </View>

        {/* ── Metadata ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text role="caption" color="oliveDark">
            {recipe.duration} · {servingsLabel}{recipe.tag ? ` · ${recipe.tag}` : ''}
          </Text>
          <View style={{ height: spacing.md }} />
          <ServingScaleControl
            baseServings={baseServings}
            scale={scale}
            onChange={setScale}
          />
          <View style={{ height: spacing.md }} />
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              category
                ? `Category: ${RECIPE_CATEGORY_LABELS[category]}, tap to change`
                : 'Add category'
            }
            style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.6 }]}
            hitSlop={4}
          >
            <Text role="caption" color={category ? 'terracotta' : 'inkMuted'}>
              {category ? RECIPE_CATEGORY_LABELS[category] : 'Add category'}
            </Text>
            <Text role="caption" color={category ? 'terracotta' : 'inkMuted'}>›</Text>
          </Pressable>
        </View>

        {/* ── Primary CTAs ───────────────────────────────────────────── */}
        <View style={styles.ctaRow}>
          <View style={styles.ctaItem}>
            <Button
              variant="secondary"
              label="Start Prep"
              onPress={() =>
                navigation.navigate('PrepMode', { recipeId: recipe.id, scale })
              }
            />
          </View>
          <View style={styles.ctaItem}>
            <Button
              variant="primary"
              label="Start Cooking →"
              onPress={() =>
                navigation.navigate('CookMode', { recipeId: recipe.id, scale })
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
                {displayAmount(ing.amount)} {ing.name}
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
        {displayedTools.length > 0 && (
          <View style={[styles.section, styles.toolsSection]}>
            <SectionLabel>TOOLS</SectionLabel>
            <View style={{ height: spacing.md }} />
            <View style={styles.toolsList}>
              {displayedTools.map((tool) => (
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

      <ActionSheet
        visible={menuOpen}
        title={recipe.title}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
      />

      <CategoryPickerSheet
        visible={pickerOpen}
        value={category}
        onSelect={handleCategoryChange}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroSaving: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 242, 234, 0.6)',
  },
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
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
    fontWeight: '700',
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
