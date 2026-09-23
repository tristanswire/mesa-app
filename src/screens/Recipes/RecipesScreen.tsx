import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, ChevronRight, Link, Search } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAPSULE_NAV_CLEARANCE } from '../../components/CapsuleNav';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { Pill } from '../../components/Pill';
import { RecipeCard } from '../../components/RecipeCard';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import {
  useCookedRecipeIds,
  useRecipeSearch,
  useRecipesList,
  useRecipeTagIndex,
} from '../../data/hooks';
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type RecipeCategory,
  type RecipeListItem,
} from '../../data/recipes';
import {
  BANK_FILTER_CATEGORY,
  BANK_FILTER_LABELS,
  BANK_SHORTCUT_FILTERS,
  matchesBankFilter,
  type BankFilterKey,
} from '../../lib/bankFilters';
import type { MainStackParamList, TabsParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<TabsParamList, 'Recipes'>;

// Filter pill row: "All", the three shortcut pills Home links to (Under 30
// min, Weeknight, Never cooked — rules in lib/bankFilters), then the 9
// user-assignable categories. Category is single-select; a shortcut toggles on
// top of it. `recipe.tag` is only read through the Weeknight rule.
type FilterValue = 'All' | RecipeCategory;

function asTintKey(value: string | null): 'terracotta' | 'olive' | undefined {
  return value === 'terracotta' || value === 'olive' ? value : undefined;
}

type HeaderProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeFilter: FilterValue;
  onFilterPress: (filter: FilterValue) => void;
  /** Auto-tags present in the library, most common first. Empty hides the row. */
  tags: string[];
  activeTag: string | null;
  onTagPress: (tag: string) => void;
  /** Under 30 min / Weeknight / Never cooked — toggles, ANDed with the category. */
  shortcut: BankFilterKey | null;
  onShortcutPress: (key: BankFilterKey) => void;
  searchRef: React.Ref<TextInput>;
  /** False while a filter applied from Home is in effect. */
  showAddCard: boolean;
  onAddPress: () => void;
};

// Import entry point for the Recipes screen (the other is the capsule nav's
// "+"). Recipes only — Home deliberately doesn't carry it.
function AddRecipeCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a recipe"
      style={({ pressed }) => [styles.addCard, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.addIcon}>
        <Link size={20} color={colors.white} strokeWidth={1.8} />
      </View>
      <View style={styles.addText}>
        <Text role="body" style={styles.addTitle}>Add a recipe</Text>
        <Text role="caption" style={styles.addSubtitle}>
          Paste a link, snap a photo, or share from Safari.
        </Text>
      </View>
      <ChevronRight size={18} color={colors.terracotta} strokeWidth={1.8} />
    </Pressable>
  );
}

function ScreenHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterPress,
  tags,
  activeTag,
  onTagPress,
  shortcut,
  onShortcutPress,
  searchRef,
  showAddCard,
  onAddPress,
}: HeaderProps) {
  return (
    <View>
      <Text role="display">My Recipes</Text>
      <View style={{ height: spacing.base }} />
      {showAddCard && (
        <>
          <AddRecipeCard onPress={onAddPress} />
          <View style={{ height: spacing.base }} />
        </>
      )}
      <Input
        icon={Search}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search recipes…"
        accessibilityLabel="Search recipes"
        inputRef={searchRef}
      />
      <View style={{ height: spacing.base }} />
      {/* Full-bleed: negative margin escapes listContent paddingHorizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pillsContent}
      >
        {/* "All" is active only when nothing at all narrows the list. */}
        <Pill
          label="All"
          active={activeFilter === 'All' && shortcut === null}
          onPress={() => onFilterPress('All')}
        />
        {BANK_SHORTCUT_FILTERS.map((key) => (
          <Pill
            key={key}
            label={BANK_FILTER_LABELS[key]}
            active={shortcut === key}
            onPress={() => onShortcutPress(key)}
          />
        ))}
        {RECIPE_CATEGORIES.map((category) => (
          <Pill
            key={category}
            label={RECIPE_CATEGORY_LABELS[category]}
            active={activeFilter === category}
            onPress={() => onFilterPress(category)}
          />
        ))}
      </ScrollView>

      {/* Auto-tag row. Only recipes imported since tags shipped have any, so
          this stays hidden for an untagged library rather than showing an
          empty rail. Tapping the active tag clears it — there is no "All"
          pill here because the category row above already owns that idiom. */}
      {tags.length > 0 && (
        <>
          <View style={{ height: spacing.sm }} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContent}
          >
            {tags.map((tag) => (
              <Pill
                key={tag}
                label={tag}
                active={activeTag === tag}
                onPress={() => onTagPress(tag)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Gap between filter pills and card grid */}
      <View style={{ height: spacing.lg }} />
    </View>
  );
}

// 4 placeholder cards to fill the visible viewport while data loads.
function GridSkeleton() {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton height={140} borderRadius={radii.md} />
          <View style={{ height: spacing.sm }} />
          <Skeleton height={14} width="80%" />
          <View style={{ height: spacing.xs }} />
          <Skeleton height={12} width="40%" />
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RecipesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterValue>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState<BankFilterKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  // Set when Home applied a filter; hides the Add card so the result starts at
  // the search field. Drops once the user clears back to an unfiltered list.
  const [filteredFromHome, setFilteredFromHome] = useState(false);
  const isFiltered = activeFilter !== 'All' || shortcut !== null;
  useEffect(() => {
    if (!isFiltered) setFilteredFromHome(false);
  }, [isFiltered]);

  const { data: recipes, ready } = useRecipesList();
  const tagIndex = useRecipeTagIndex();
  const cookedIds = useCookedRecipeIds();

  // Apply a Home shortcut. Keyed on `request` so tapping the same chip twice
  // still resets filters the user changed in between.
  const request = route.params?.request;
  useEffect(() => {
    const params = route.params;
    if (!params) return;
    if (params.filter) {
      const category = BANK_FILTER_CATEGORY[params.filter];
      // Meal types select their category pill; the rest select their shortcut
      // pill. Either way the Home filter replaces whatever was set before.
      setActiveFilter(category ?? 'All');
      setShortcut(category ? null : params.filter);
      setActiveTag(null);
      setSearchQuery('');
      setFilteredFromHome(true);
    }
    if (params.focusSearch) setFocusRequest(params.request);
  }, [request]); // params read fresh; only a new request re-applies them

  // The field remounts when the loading skeleton gives way to the list, so
  // focus waits until the real header is up.
  useEffect(() => {
    if (!focusRequest || !ready) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, ready]);
  // null means "nothing typed"; an empty Map means "searched, matched nothing".
  const searchResults = useRecipeSearch(searchQuery);

  // "All" clears the shortcut too, so it always means the whole library.
  const handleFilterPress = async (filter: FilterValue) => {
    await Haptics.selectionAsync();
    setActiveFilter(filter);
    if (filter === 'All') setShortcut(null);
  };

  // Tapping the active shortcut clears it.
  const handleShortcutPress = async (key: BankFilterKey) => {
    await Haptics.selectionAsync();
    setShortcut((current) => (current === key ? null : key));
  };

  // Tapping the active tag clears it, so the row needs no reset pill.
  const handleTagPress = async (tag: string) => {
    await Haptics.selectionAsync();
    setActiveTag((current) => (current === tag ? null : tag));
  };

  // Only tags the visible library actually uses, ordered by how many recipes
  // carry them — the useful ones surface without a rail of one-offs pushing
  // them off-screen.
  const tagOptions = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const recipe of recipes) {
      for (const tag of tagIndex.get(recipe.id) ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [recipes, tagIndex]);

  // Filter pipeline: category pill, then tag pill, then search. Search runs in
  // SQL across title, tags, ingredient names and cook notes (see
  // searchRecipeIds) rather than over the in-memory titles this screen holds.
  const visibleRecipes = recipes.filter((r) => {
    if (activeFilter !== 'All' && r.category !== activeFilter) return false;
    if (activeTag && !(tagIndex.get(r.id) ?? []).includes(activeTag)) return false;
    if (
      shortcut &&
      !matchesBankFilter(shortcut, r, { tags: tagIndex.get(r.id) ?? [], cookedIds })
    ) {
      return false;
    }
    if (searchResults && !searchResults.has(r.id)) return false;
    return true;
  });

  // Ranked order only while searching — title hits first, then tag, ingredient,
  // notes. Array.sort is stable, so recipes tied on rank keep recency order,
  // which is what the unsearched list is already sorted by.
  const filteredRecipes = searchResults
    ? [...visibleRecipes].sort(
        (a, b) => (searchResults.get(a.id) ?? 0) - (searchResults.get(b.id) ?? 0),
      )
    : visibleRecipes;

  const showSkeleton = !ready;
  const showEmptyState = ready && recipes.length === 0;
  const showNoMatches = ready && recipes.length > 0 && filteredRecipes.length === 0;

  const renderItem = ({ item }: { item: RecipeListItem }) => (
    <View style={styles.cardItem}>
      <RecipeCard
        variant="grid"
        title={item.title}
        duration={item.duration}
        tag={item.tag ?? undefined}
        category={item.category ? RECIPE_CATEGORY_LABELS[item.category] : undefined}
        tintKey={asTintKey(item.tintKey)}
        imageUrl={item.imageUrl}
        onPress={() =>
          navigation.navigate('RecipeDetail', { recipeId: item.id })
        }
      />
    </View>
  );

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        {showSkeleton ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: insets.bottom + CAPSULE_NAV_CLEARANCE,
              },
            ]}
          >
            <ScreenHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterPress={handleFilterPress}
              tags={tagOptions}
              activeTag={activeTag}
              onTagPress={handleTagPress}
              shortcut={shortcut}
              onShortcutPress={handleShortcutPress}
              searchRef={searchRef}
              showAddCard={!filteredFromHome}
              onAddPress={() => navigation.navigate('Import')}
            />
            <GridSkeleton />
          </ScrollView>
        ) : showEmptyState ? (
          <View style={styles.emptyRoot}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                {
                  paddingTop: insets.top + spacing.lg,
                  paddingBottom: insets.bottom + CAPSULE_NAV_CLEARANCE,
                  flexGrow: 1,
                },
              ]}
            >
              <ScreenHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterPress={handleFilterPress}
                tags={tagOptions}
                activeTag={activeTag}
                onTagPress={handleTagPress}
                shortcut={shortcut}
                onShortcutPress={handleShortcutPress}
                searchRef={searchRef}
                // Empty library: the empty state below carries the import CTA.
                showAddCard={false}
                onAddPress={() => navigation.navigate('Import')}
              />
              <EmptyState
                icon={Bookmark}
                title="No recipes yet."
                description="Paste a recipe link from any cooking site and Mesa cleans it up. Your library starts here."
                ctaLabel="Import a recipe"
                onCta={() => navigation.navigate('Import')}
              />
            </ScrollView>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            numColumns={2}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <ScreenHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={activeFilter}
                onFilterPress={handleFilterPress}
                tags={tagOptions}
                activeTag={activeTag}
                onTagPress={handleTagPress}
                shortcut={shortcut}
                onShortcutPress={handleShortcutPress}
                searchRef={searchRef}
                showAddCard={!filteredFromHome}
                onAddPress={() => navigation.navigate('Import')}
              />
            }
            ListEmptyComponent={
              showNoMatches ? (
                <View style={styles.noMatchesBlock}>
                  <Text role="body" color="oliveDark" align="center">
                    {searchQuery.trim()
                      ? 'No recipes match that search.'
                      : 'No recipes match this filter.'}
                  </Text>
                </View>
              ) : null
            }
            renderItem={renderItem}
            columnWrapperStyle={filteredRecipes.length > 0 ? styles.columnWrapper : undefined}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: insets.bottom + CAPSULE_NAV_CLEARANCE,
              },
            ]}
          />
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  emptyRoot: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  // Add a recipe card. Inherits the 24 list gutter so it lines up with the
  // title and search field.
  addCard: {
    minHeight: 76,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.clay,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  addTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  addSubtitle: {
    fontSize: 12,
    lineHeight: 16, // 1.35 × 12
  },
  // Negative margin breaks out of listContent paddingHorizontal so pills reach screen edges
  pillsScroll: {
    marginHorizontal: -spacing.lg,
  },
  pillsContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  cardItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  noMatchesBlock: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  // 50% with the gap baked in, so two cards per row align with the real grid.
  skeletonCard: {
    width: '48%',
  },
});
