import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { RecipeCard } from '../../components/RecipeCard';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';
import { mockFilters, mockRecipes } from './mockData';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Recipe = (typeof mockRecipes)[number];

// ─── File-local subcomponents ─────────────────────────────────────────────────
// FilterPill and ScreenHeader live here until the pill pattern repeats elsewhere.

function FilterPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
    >
      <Text
        role="caption"
        color={isActive ? 'cream' : 'ink'}
        style={styles.pillText}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type HeaderProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeFilter: string;
  onFilterPress: (filter: string) => void;
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
        placeholder="Search recipes, ingredients…"
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
        {mockFilters.map((filter) => (
          <FilterPill
            key={filter}
            label={filter}
            isActive={activeFilter === filter}
            onPress={() => onFilterPress(filter)}
          />
        ))}
      </ScrollView>
      {/* Gap between filter pills and card grid */}
      <View style={{ height: spacing.lg }} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function RecipesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterPress = async (filter: string) => {
    await Haptics.selectionAsync();
    setActiveFilter(filter);
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <View style={styles.cardItem}>
      <RecipeCard
        variant="grid"
        title={item.title}
        duration={item.duration}
        tag={item.tag}
        tintKey={item.tintKey}
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
        <FlatList
          data={mockRecipes}
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
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + spacing.lg },
          ]}
          // TODO Phase 2.11: add empty state UI when data.length === 0
        />
        <FAB
          onPress={() => navigation.navigate('Import')}
          accessibilityLabel="Import a recipe"
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
  },
  pill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.terracotta,
  },
  pillInactive: {
    backgroundColor: colors.oat,
  },
  pillText: {
    fontWeight: '500',
  },
  columnWrapper: {
    gap: spacing.md,
  },
  cardItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
