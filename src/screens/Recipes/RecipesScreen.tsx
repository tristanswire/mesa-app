import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChefHat } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { Pill } from '../../components/Pill';
import { RecipeCard } from '../../components/RecipeCard';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { mockFilters, mockRecipes } from './mockData';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Recipe = (typeof mockRecipes)[number];

// Flip to true to preview the empty state layout (Phase 3 wires real logic)
const showEmptyState = false;

// TODO Phase 3: loading skeleton while recipes fetch from local DB

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
          <Pill
            key={filter}
            label={filter}
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
        {showEmptyState ? (
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
            <View style={styles.emptyState}>
              <ChefHat size={48} color={colors.clay} strokeWidth={1.5} />
              <View style={{ height: spacing.md }} />
              <Text role="headline" align="center">Your recipe bank is empty.</Text>
              <View style={{ height: spacing.xs }} />
              <Text role="caption" color="oliveDark" align="center">
                Everything you import shows up here.
              </Text>
              <View style={{ height: spacing.lg }} />
              <Button
                variant="primary"
                label="Import a recipe"
                onPress={() => navigation.navigate('Import')}
              />
            </View>
          </ScrollView>
        ) : (
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
          />
        )}
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
    gap: spacing.sm,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  cardItem: {
    flex: 1,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
});
