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
import { useRecipesList } from '../../data/hooks';
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
};

function ScreenHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterPress,
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
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipes, ready } = useRecipesList();

  const handleFilterPress = async (filter: FilterValue) => {
    await Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  // Filter pipeline: category pill (skipped when 'All'), then case-insensitive
  // title substring match. Search-by-ingredient is intentionally deferred —
  // would require joining the ingredients table in useRecipesList, and title
  // match covers the common case.
  const filteredRecipes = recipes.filter((r) => {
    if (activeFilter !== 'All' && r.category !== activeFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q && !r.title.toLowerCase().includes(q)) return false;
    return true;
  });

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
              />
              <EmptyState
                icon={Bookmark}
                title="No recipes yet."
                description="Import a recipe from any cooking site, take a photo, or enter one manually. Your library starts here."
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
              />
            }
            ListEmptyComponent={
              showNoMatches ? (
                <View style={styles.noMatchesBlock}>
                  <Text role="body" color="oliveDark" align="center">
                    No recipes match this filter.
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
