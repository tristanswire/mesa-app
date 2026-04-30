import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ChefHat } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { FAB } from '../../components/FAB';
import { RecipeCard } from '../../components/RecipeCard';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { useHomeData } from '../../data/hooks';
import type { RecipeListItem } from '../../data/recipes';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// TODO Phase 3: derive greeting from device time-of-day
const GREETING = 'Good evening';

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

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  const showEmptyState = !lastCooked && inYourBank.length === 0;

  const renderHorizontalCard = (item: RecipeListItem) => (
    <View key={item.id} style={[styles.cardWrap, { width: cardWidth }]}>
      <RecipeCard
        variant="grid"
        title={item.title}
        duration={item.duration}
        tag={item.tag ?? undefined}
        tintKey={asTintKey(item.tintKey)}
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
          <SectionLabel>{GREETING}</SectionLabel>

          {showEmptyState ? (
            /* ── Empty state ────────────────────────────────────────── */
            <View style={styles.emptyState}>
              <View style={{ height: spacing.xl }} />
              <ChefHat size={48} color={colors.clay} strokeWidth={1.5} />
              <View style={{ height: spacing.md }} />
              <Text role="headline">Let's cook something.</Text>
              <View style={{ height: spacing.xs }} />
              <Text role="caption" color="oliveDark">
                Import your first recipe to get started.
              </Text>
              <View style={{ height: spacing.lg }} />
              <Button
                variant="primary"
                label="Import a recipe"
                onPress={() => navigation.navigate('Import')}
              />
            </View>
          ) : (
            /* ── Populated state ─────────────────────────────────────── */
            <>
              <View style={{ height: spacing.xs }} />
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
                    tintKey={asTintKey(lastCooked.tintKey)}
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
  emptyState: {
    alignItems: 'center',
  },
});
