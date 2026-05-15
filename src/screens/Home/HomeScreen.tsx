import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ChefHat } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { FAB } from '../../components/FAB';
import { RecipeCard } from '../../components/RecipeCard';
import { SectionLabel } from '../../components/SectionLabel';
import { Skeleton } from '../../components/Skeleton';
import { Text } from '../../components/Text';
import { useHomeData } from '../../data/hooks';
import { RECIPE_CATEGORY_LABELS, type RecipeListItem } from '../../data/recipes';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// Time-of-day greeting. No name suffix yet — user.name isn't stored in any
// data layer (ProfileScreen still uses a hardcoded mock). When auth lands and
// user_preferences gains a name field, append `, ${name}` here.
function getTimeGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

function asTintKey(value: string | null): 'terracotta' | 'olive' | undefined {
  return value === 'terracotta' || value === 'olive' ? value : undefined;
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // 65% width so the adjacent card peeks ~100pt into view
  const cardWidth = width * 0.65;

  const { lastCooked, inYourBank, worthATry, ready } = useHomeData();
  const greeting = getTimeGreeting();

  if (!ready) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg },
          ]}
        >
          <Text role="body" style={styles.greeting}>{greeting}</Text>
          <View style={{ height: spacing.base }} />
          <Skeleton height={32} width="80%" />

          <View style={{ height: spacing.lg }} />

          {/* Hero card skeleton */}
          <Skeleton height={200} borderRadius={radii.md} />
          <View style={{ height: spacing.md }} />
          <Skeleton height={11} width="30%" />
          <View style={{ height: spacing.xs }} />
          <Skeleton height={20} width="70%" />
          <View style={{ height: spacing.sm }} />
          <Skeleton height={13} width="40%" />

          <View style={{ height: spacing.xl }} />

          <SectionLabel>IN YOUR BANK</SectionLabel>
          <View style={{ height: spacing.md }} />

          {/* Horizontal row skeleton — 2 cards visible */}
          <View style={styles.bankRow}>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.bankCard, { width: cardWidth }]}>
                <Skeleton height={120} borderRadius={radii.md} />
                <View style={{ height: spacing.sm }} />
                <Skeleton height={14} width="80%" />
                <View style={{ height: spacing.xs }} />
                <Skeleton height={12} width="50%" />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  const showEmptyState = !lastCooked && inYourBank.length === 0 && worthATry.length === 0;

  if (showEmptyState) {
    return (
      <>
        <StatusBar style="dark" />
        <View style={styles.root}>
          <View style={[styles.emptyContainer, { paddingTop: insets.top + spacing.xxl }]}>
            <EmptyState
              icon={ChefHat}
              title="Welcome to Mesa."
              description="Import your first recipe to start your library, then come back here to pick up where you left off."
              ctaLabel="Import a recipe"
              onCta={() => navigation.navigate('Import')}
            />
          </View>
          <FAB
            onPress={() => navigation.navigate('Import')}
            accessibilityLabel="Import a recipe"
            testID="fab-import"
          />
        </View>
      </>
    );
  }

  const renderHorizontalCard = (item: RecipeListItem) => (
    <View key={item.id} style={[styles.cardWrap, { width: cardWidth }]}>
      <RecipeCard
        variant="grid"
        title={item.title}
        duration={item.duration}
        tag={item.tag ?? undefined}
        category={item.category ? RECIPE_CATEGORY_LABELS[item.category] : undefined}
        tintKey={asTintKey(item.tintKey)}
        imageUrl={item.imageUrl}
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
      />
    </View>
  );

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg },
          ]}
        >
          {/* Greeting */}
          <Text role="body" style={styles.greeting}>{greeting}</Text>
          <View style={{ height: spacing.base }} />
          <Text role="headline">Pick up where you left off.</Text>

          {/* Hero — last cooked */}
          {lastCooked && (
            <>
              <View style={{ height: spacing.base }} />
              <RecipeCard
                variant="hero"
                label="LAST COOKED"
                title={lastCooked.title}
                duration={lastCooked.duration}
                tag={lastCooked.tag ?? undefined}
                category={lastCooked.category ? RECIPE_CATEGORY_LABELS[lastCooked.category] : undefined}
                tintKey={asTintKey(lastCooked.tintKey)}
                imageUrl={lastCooked.imageUrl}
                ctaLabel="Cook Again →"
                onPress={() =>
                  navigation.navigate('RecipeDetail', { recipeId: lastCooked.id })
                }
              />
            </>
          )}

          {/* In Your Bank */}
          {inYourBank.length > 0 && (
            <>
              <View style={{ height: spacing.xl }} />
              <SectionLabel>IN YOUR BANK</SectionLabel>
              <View style={{ height: spacing.md }} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalContent}
              >
                {inYourBank.map(renderHorizontalCard)}
              </ScrollView>
            </>
          )}

          {/* Worth a Try */}
          {worthATry.length > 0 && (
            <>
              <View style={{ height: spacing.xl }} />
              <SectionLabel>WORTH A TRY</SectionLabel>
              <View style={{ height: spacing.md }} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalContent}
              >
                {worthATry.map(renderHorizontalCard)}
              </ScrollView>
            </>
          )}

          {/* Bottom clearance for FAB + tab bar */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        <FAB
          onPress={() => navigation.navigate('Import')}
          accessibilityLabel="Import a recipe"
          testID="fab-import"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  // Negative horizontal margin escapes the parent paddingHorizontal,
  // letting cards align with screen edges and reveal the peek on the right.
  horizontalScroll: {
    marginHorizontal: -spacing.lg,
  },
  horizontalContent: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  cardWrap: {
    marginRight: spacing.md,
  },
  // Warm, name-personalized greeting sitting above the dashboard headline.
  // Slightly larger and heavier than body so it feels addressed-to-you, but
  // intentionally below headline scale to keep "Pick up where you left off."
  // as the primary callout.
  greeting: {
    fontSize: 18,
    fontWeight: '500',
  },
  bankRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bankCard: {
    flexShrink: 0,
  },
  emptyContainer: {
    flex: 1,
  },
});
