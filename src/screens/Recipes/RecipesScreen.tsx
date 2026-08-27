import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { Pill } from '../../components/Pill';
import { RecipeCard } from '../../components/RecipeCard';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { useRecipeSearch, useRecipesList, useRecipeTagIndex } from '../../data/hooks';
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type RecipeCategory,
  type RecipeListItem,
} from '../../data/recipes';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// Filter pills: "All" + the 9 user-assignable categories. Tag-based filtering
// (Weeknight, Quick, etc.) was wired but never applied before Phase 3.22 — now
// replaced by category, the user-controlled dimension. `recipe.tag` remains on
// the schema but is no longer exposed as a filter.
type FilterValue = 'All' | RecipeCategory;
const FILTERS: FilterValue[] = ['All', ...RECIPE_CATEGORIES];

function filterLabel(value: FilterValue): string {
  return value === 'All' ? 'All' : RECIPE_CATEGORY_LABELS[value];
}

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
};

function ScreenHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterPress,
  tags,
  activeTag,
  onTagPress,
}: HeaderProps) {
  return (
    <View>
      <Text role="display">My Recipes</Text>
      <View style={{ height: spacing.base }} />
      <Input
        icon={Search}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search recipes…"
        accessibilityLabel="Search recipes"
      />
      <View style={{ height: spacing.base }} />
      {/* Full-bleed: negative margin escapes listContent paddingHorizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pillsContent}
      >
        {FILTERS.map((filter) => (
          <Pill
            key={filter}
            label={filterLabel(filter)}
            active={activeFilter === filter}
            onPress={() => onFilterPress(filter)}
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
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterValue>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipes, ready } = useRecipesList();
  const tagIndex = useRecipeTagIndex();
  // null means "nothing typed"; an empty Map means "searched, matched nothing".
  const searchResults = useRecipeSearch(searchQuery);

  const handleFilterPress = async (filter: FilterValue) => {
    await Haptics.selectionAsync();
    setActiveFilter(filter);
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
              { paddingTop: insets.top + spacing.lg },
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
            />
            <GridSkeleton />
          </ScrollView>
        ) : showEmptyState ? (
          <View style={styles.emptyRoot}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingTop: insets.top + spacing.lg, flexGrow: 1 },
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
              { paddingTop: insets.top + spacing.lg },
            ]}
          />
        )}
        <FAB
          onPress={() => navigation.navigate('Import')}
          accessibilityLabel="Import a recipe"
          testID="fab-import"
        />
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
    paddingBottom: spacing.xxl,
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
