import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  Bookmark,
  Cake,
  ChefHat,
  Clock,
  Search,
  Soup,
  Sun,
  Utensils,
  type LucideProps,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAPSULE_NAV_CLEARANCE } from '../../components/CapsuleNav';
import { EmptyState } from '../../components/EmptyState';
import { RecipeImagePlaceholder } from '../../components/RecipeImagePlaceholder';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { useCookedRecipeIds, useHomeData, useRecipeTagIndex } from '../../data/hooks';
import { RECIPE_CATEGORY_LABELS, type RecipeListItem } from '../../data/recipes';
import { MOCK_PROFILE_NAME } from '../../data/user';
import {
  BANK_FILTER_LABELS,
  matchesBankFilter,
  type BankFilterKey,
} from '../../lib/bankFilters';
import { formatRelativeDate } from '../../lib/relativeDate';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type LucideIcon = React.ComponentType<LucideProps>;

// Off-scale values from the Home spec (the theme scale is 4-based but has no
// 20/52/10 steps).
const HEADER_GUTTER = 20;
const HEADER_BOTTOM = 52;
const HEADER_BOTTOM_NO_CARD = 24;
const CARD_OVERLAP = 34;
const GRID_GAP = 10;
const BANK_TOP = 28;

const HEADER_CHIPS: BankFilterKey[] = ['under30', 'weeknight', 'breakfast', 'dessert'];

// Badge colors come in pairs picked for the icon on its fill. The icons are
// decorative (the tile name labels them), which is what lets Clay carry one.
const BANK_TILES: {
  key: BankFilterKey;
  icon: LucideIcon;
  badge: string;
  iconColor: string;
}[] = [
  { key: 'breakfast', icon: Sun, badge: colors.clay, iconColor: colors.white },
  { key: 'dinner', icon: Utensils, badge: colors.terracotta, iconColor: colors.white },
  { key: 'under30', icon: Clock, badge: colors.pine, iconColor: colors.oat },
  { key: 'dessert', icon: Cake, badge: colors.oat, iconColor: colors.terracotta },
  { key: 'sides', icon: Soup, badge: colors.olive, iconColor: colors.white },
  { key: 'neverCooked', icon: Bookmark, badge: colors.ink, iconColor: colors.oat },
];

function getTimeGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function pluralRecipes(n: number): string {
  return `${n} ${n === 1 ? 'recipe' : 'recipes'}`;
}

// Text role supplies Inter + Dynamic Type; these override size/weight. The
// family has to change with the weight — Inter ships one file per weight.
const inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

function font(
  size: number,
  weight: '400' | '500' | '600' | '700',
  extra: TextStyle = {},
): TextStyle {
  const family =
    weight === '700'
      ? inter.bold
      : weight === '600'
        ? inter.semiBold
        : weight === '500'
          ? inter.medium
          : inter.regular;
  return { fontFamily: family, fontWeight: weight, fontSize: size, ...extra };
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  // Tabs stay mounted, so a StatusBar here would outlive the visit. Home is the
  // only tab with a dark (Pine) top, so it claims "light" only while focused.
  const isFocused = useIsFocused();

  const { lastCooked, lastCookedAt, recipes, ready } = useHomeData();
  const tagIndex = useRecipeTagIndex();
  const cookedIds = useCookedRecipeIds();

  const firstName = MOCK_PROFILE_NAME.trim().split(/\s+/)[0] ?? '';
  const greeting = firstName ? `${getTimeGreeting()}, ${firstName}` : getTimeGreeting();
  const initial = firstName.charAt(0).toUpperCase();

  // Same predicates the Recipes screen filters with, so a tile's count is the
  // number of recipes the tap shows.
  const counts = useMemo(() => {
    const result = {} as Record<BankFilterKey, number>;
    for (const tile of BANK_TILES) {
      result[tile.key] = recipes.filter((r) =>
        matchesBankFilter(tile.key, r, { tags: tagIndex.get(r.id) ?? [], cookedIds }),
      ).length;
    }
    return result;
  }, [recipes, tagIndex, cookedIds]);

  const openRecipes = (params: { filter?: BankFilterKey; focusSearch?: boolean } = {}) =>
    navigation.navigate('Tabs', {
      screen: 'Recipes',
      params: { ...params, request: Date.now() },
    });

  const isEmptyLibrary = ready && recipes.length === 0;
  const showLastCooked = ready && lastCooked !== null;

  return (
    <>
      {isFocused && <StatusBar style="light" />}
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + CAPSULE_NAV_CLEARANCE }}
      >
        {/* Pine behind the top overscroll, so pulling down doesn't expose Cream
            above the header. */}
        <View style={styles.overscrollBackdrop} />

        {/* ── Header (Pine) ───────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + HEADER_GUTTER,
              paddingBottom: showLastCooked ? HEADER_BOTTOM : HEADER_BOTTOM_NO_CARD,
            },
          ]}
        >
          <View style={styles.greetingRow}>
            <Text role="body" color="sage" style={styles.greeting} numberOfLines={1}>
              {greeting}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={4}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            >
              <Text role="body" color="pine" style={styles.avatarInitial} maxFontSizeMultiplier={1.2}>
                {initial}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: spacing.base }} />
          <Text role="display" color="cream" style={styles.headline}>
            What are we cooking tonight?
          </Text>

          <View style={{ height: HEADER_GUTTER }} />
          <Pressable
            onPress={() => openRecipes({ focusSearch: true })}
            accessibilityRole="button"
            accessibilityLabel="Search recipes or ingredients"
            accessibilityHint="Opens search in Recipes"
            style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
          >
            <Search size={18} color={colors.oliveDark} strokeWidth={1.6} />
            <Text role="body" color="oliveDark" style={styles.searchPlaceholder} numberOfLines={1}>
              Search recipes or ingredients
            </Text>
          </Pressable>

          <View style={{ height: spacing.md }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {HEADER_CHIPS.map((key) => (
              <Pressable
                key={key}
                onPress={() => openRecipes({ filter: key })}
                accessibilityRole="button"
                accessibilityLabel={`Show ${BANK_FILTER_LABELS[key]} recipes`}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              >
                <Text role="body" color="oat" style={styles.chipLabel}>
                  {BANK_FILTER_LABELS[key]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Last cooked ─────────────────────────────────────────────── */}
        {showLastCooked && lastCooked && (
          <LastCookedCard
            recipe={lastCooked}
            cookedAt={lastCookedAt}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: lastCooked.id })}
          />
        )}

        {/* ── Your bank ───────────────────────────────────────────────── */}
        <View style={styles.bankSection}>
          {isEmptyLibrary ? (
            <EmptyState
              icon={ChefHat}
              title="Welcome to Mesa."
              description="Import your first recipe to start your library. Use the + below any time."
              ctaLabel="Import a recipe"
              onCta={() => navigation.navigate('Import')}
            />
          ) : (
            <>
              <View style={styles.bankHeader}>
                <Text role="headline" style={styles.bankTitle}>Your bank</Text>
                {ready && (
                  <Pressable
                    onPress={() => openRecipes()}
                    accessibilityRole="button"
                    accessibilityLabel={`All ${pluralRecipes(recipes.length)}`}
                    hitSlop={8}
                  >
                    <Text role="caption" color="terracotta" style={styles.bankCount}>
                      {pluralRecipes(recipes.length)}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={{ height: spacing.md }} />
              <View style={styles.grid}>
                {BANK_TILES.map((tile) =>
                  ready ? (
                    <BankTile
                      key={tile.key}
                      label={BANK_FILTER_LABELS[tile.key]}
                      count={counts[tile.key]}
                      icon={tile.icon}
                      badge={tile.badge}
                      iconColor={tile.iconColor}
                      onPress={() => openRecipes({ filter: tile.key })}
                    />
                  ) : (
                    <View key={tile.key} style={styles.tileSlot}>
                      <Skeleton height={68} borderRadius={18} />
                    </View>
                  ),
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

// ─── Last cooked card ─────────────────────────────────────────────────────────

function LastCookedCard({
  recipe,
  cookedAt,
  onPress,
}: {
  recipe: RecipeListItem;
  cookedAt: string | null;
  onPress: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const meta = [
    recipe.duration,
    recipe.category ? RECIPE_CATEGORY_LABELS[recipe.category] : null,
    cookedAt ? formatRelativeDate(cookedAt) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Last cooked: ${recipe.title}. ${meta}. Cook again`}
      style={({ pressed }) => [styles.lastCard, pressed && styles.pressed]}
    >
      <View style={styles.lastImage}>
        {recipe.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: recipe.imageUrl }}
            onError={() => setImageFailed(true)}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <RecipeImagePlaceholder />
        )}
      </View>
      <View style={styles.lastBody}>
        <Text role="sectionLabel" color="terracotta" style={styles.lastLabel}>
          Last cooked
        </Text>
        <Text role="headline" style={styles.lastTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        {meta.length > 0 && (
          <Text role="caption" style={styles.lastMeta} numberOfLines={1}>
            {meta}
          </Text>
        )}
        <Text role="caption" color="terracotta" style={styles.lastCta}>
          Cook again →
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Bank tile ────────────────────────────────────────────────────────────────

function BankTile({
  label,
  count,
  icon: Icon,
  badge,
  iconColor,
  onPress,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  badge: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${pluralRecipes(count)}`}
      style={({ pressed }) => [styles.tileSlot, styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.badge, { backgroundColor: badge }]}>
        <Icon size={22} color={iconColor} strokeWidth={1.6} />
      </View>
      <View style={styles.tileText}>
        <Text role="body" style={styles.tileName} numberOfLines={1}>
          {label}
        </Text>
        <Text role="caption" style={styles.tileCount} numberOfLines={1}>
          {pluralRecipes(count)}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  pressed: {
    opacity: 0.85,
  },
  // ── Header ──────────────────────────────────────────────────────────
  overscrollBackdrop: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: colors.pine,
  },
  header: {
    backgroundColor: colors.pine,
    paddingHorizontal: HEADER_GUTTER,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greeting: {
    flex: 1,
    ...font(14, '500', { lineHeight: 20 }),
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: font(14, '700', { lineHeight: 18 }),
  headline: {
    ...font(30, '600', { letterSpacing: -0.6, lineHeight: 36 }),
    // Keeps the line break after "cooking" on standard widths.
    maxWidth: 300,
  },
  searchBar: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  searchPlaceholder: {
    flex: 1,
    ...font(15, '400', { lineHeight: 20 }),
  },
  // Full-bleed: escapes the header gutter so chips scroll edge to edge.
  chipsScroll: {
    marginHorizontal: -HEADER_GUTTER,
  },
  chipsContent: {
    paddingHorizontal: HEADER_GUTTER,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(233, 221, 207, 0.35)',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chipLabel: font(13, '500', { lineHeight: 18 }),
  // ── Last cooked ─────────────────────────────────────────────────────
  lastCard: {
    marginTop: -CARD_OVERLAP,
    marginHorizontal: HEADER_GUTTER,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 4px rgba(31, 28, 25, 0.05), 0 14px 32px rgba(31, 28, 25, 0.10)',
  },
  lastImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    overflow: 'hidden',
  },
  lastBody: {
    flex: 1,
    gap: 2,
  },
  lastLabel: {
    ...font(11, '600'),
    letterSpacing: 1.54,
  },
  lastTitle: font(18, '600', { lineHeight: 24 }),
  lastMeta: font(13, '400', { lineHeight: 18 }),
  lastCta: {
    ...font(13, '600', { lineHeight: 18 }),
    marginTop: spacing.xs,
  },
  // ── Your bank ───────────────────────────────────────────────────────
  bankSection: {
    paddingHorizontal: HEADER_GUTTER,
    paddingTop: BANK_TOP,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  bankTitle: font(18, '600', { lineHeight: 24 }),
  bankCount: font(13, '500'),
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  // Two per row: a 40% basis leaves room for exactly two plus the gap, and
  // flexGrow splits the remainder evenly.
  tileSlot: {
    flexBasis: '40%',
    flexGrow: 1,
  },
  tile: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 1px 2px rgba(31, 28, 25, 0.05), 0 6px 16px rgba(31, 28, 25, 0.05)',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    flex: 1,
  },
  tileName: font(14, '600', { lineHeight: 18 }),
  tileCount: font(12, '400', { lineHeight: 16 }),
});
