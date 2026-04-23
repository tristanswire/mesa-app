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
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { mockHomeData } from './mockData';

type Nav = NativeStackNavigationProp<MainStackParamList>;

// Flip to true to preview the empty state layout (Phase 3 wires real logic)
const showEmptyState = false;

// TODO Phase 3: loading skeleton while recipes fetch from local DB

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // 65% width so the adjacent card peeks ~100pt into view
  const cardWidth = width * 0.65;

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
          {/* TODO Phase 3: derive greeting from device time-of-day */}
          <SectionLabel>{mockHomeData.greeting}</SectionLabel>

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
              <View style={{ height: spacing.base }} />
              <RecipeCard
                variant="hero"
                label="LAST COOKED"
                title={mockHomeData.lastCooked.title}
                duration={mockHomeData.lastCooked.duration}
                tag={mockHomeData.lastCooked.tag}
                tintKey={mockHomeData.lastCooked.placeholderTint}
                ctaLabel="Cook Again →"
                onPress={() =>
                  navigation.navigate('RecipeDetail', { recipeId: mockHomeData.lastCooked.id })
                }
              />

              {/* In Your Bank */}
              <View style={{ height: spacing.xl }} />
              <SectionLabel>IN YOUR BANK</SectionLabel>
              <View style={{ height: spacing.md }} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                // Bleed out of parent's horizontal padding so cards reach screen edges
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalContent}
              >
                {mockHomeData.inYourBank.map((item) => (
                  <View key={item.id} style={[styles.cardWrap, { width: cardWidth }]}>
                    <RecipeCard
                      variant="grid"
                      title={item.title}
                      duration={item.duration}
                      tag={item.tag}
                      tintKey={item.placeholderTint}
                      onPress={() =>
                        navigation.navigate('RecipeDetail', { recipeId: item.id })
                      }
                    />
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* Worth a Try — always renders */}
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
            {mockHomeData.worthATry.map((item) => (
              <View key={item.id} style={[styles.cardWrap, { width: cardWidth }]}>
                <RecipeCard
                  variant="grid"
                  title={item.title}
                  duration={item.duration}
                  tag={item.tag}
                  tintKey={item.placeholderTint}
                  onPress={() =>
                    navigation.navigate('RecipeDetail', { recipeId: item.id })
                  }
                />
              </View>
            ))}
          </ScrollView>

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
