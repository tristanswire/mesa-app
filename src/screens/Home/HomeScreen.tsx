import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB } from '../../components/FAB';
import { RecipeCard } from '../../components/RecipeCard';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { mockHomeData } from './mockData';

type Nav = NativeStackNavigationProp<MainStackParamList>;

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

          {/* Worth a Try */}
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
});
