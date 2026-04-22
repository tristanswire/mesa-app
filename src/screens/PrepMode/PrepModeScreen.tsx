import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Flame } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateCard } from '../../components/AffiliateCard';
import { IconButton } from '../../components/IconButton';
import { PrepChecklistItem } from '../../components/PrepChecklistItem';
import { ProgressBar } from '../../components/ProgressBar';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { getMockRecipeOrFallback } from '../../mocks/recipes';
import { colors, radii, shadows, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'PrepMode'>;

export function PrepModeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const recipe = getMockRecipeOrFallback(route.params.recipeId);
  const prepItems = recipe.prepItems ?? [];
  const tools = recipe.tools ?? [];

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    () => Object.fromEntries(
      prepItems.filter((i) => i.defaultChecked).map((i) => [i.id, true]),
    ),
  );

  const completedCount = Object.keys(checkedItems).length;
  const totalCount = prepItems.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const handleToggle = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.base, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <IconButton
              icon={ChevronLeft}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              size="md"
            />
          </View>

          <View style={styles.headerCenter}>
            <SectionLabel>PREP MODE</SectionLabel>
            <Text role="body" style={styles.headerTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
          </View>

          {/* Placeholder to balance the back button */}
          <View style={styles.headerIconWrap} />
        </View>

        <View style={{ height: spacing.lg }} />

        {/* ── Callout card ───────────────────────────────────────────── */}
        <View style={[styles.callout, styles.paddingH]}>
          <View style={styles.calloutIcon}>
            <Flame size={28} color={colors.terracotta} strokeWidth={1.5} />
          </View>
          <View style={styles.calloutTextStack}>
            <Text role="body" style={{ fontWeight: '600' }}>Before you start cooking</Text>
            <Text role="caption" color="oliveDark">
              Complete these steps before the heat goes on. Mesa detected them automatically.
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xl }} />

        {/* ── Progress ───────────────────────────────────────────────── */}
        {prepItems.length > 0 && (
          <View style={styles.paddingH}>
            <View style={styles.progressHeader}>
              <SectionLabel>PROGRESS</SectionLabel>
              <Text role="caption" color="terracotta">
                {completedCount} of {totalCount} complete
              </Text>
            </View>
            <View style={{ height: spacing.sm }} />
            <ProgressBar progress={progress} />
          </View>
        )}

        <View style={{ height: spacing.xl }} />

        {/* ── Kitchen prep checklist ─────────────────────────────────── */}
        {prepItems.length > 0 && (
          <View style={styles.paddingH}>
            <SectionLabel>KITCHEN PREP</SectionLabel>
            <View style={{ height: spacing.md }} />
            {prepItems.map((item) => (
              <PrepChecklistItem
                key={item.id}
                label={item.label}
                duration={item.duration}
                checked={!!checkedItems[item.id]}
                onToggle={() => handleToggle(item.id)}
              />
            ))}
          </View>
        )}

        {/* ── Tools carousel ─────────────────────────────────────────── */}
        {tools.length > 0 && (
          <>
            <View style={{ height: spacing.xl }} />
            <View style={styles.paddingH}>
              <SectionLabel>TOOLS</SectionLabel>
            </View>
            <View style={{ height: spacing.md }} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolsCarousel}
              style={styles.toolsCarouselOuter}
            >
              {tools.map((tool) => (
                <View key={tool.id} style={styles.toolCardWrap}>
                  <AffiliateCard
                    productName={tool.name}
                    price={tool.price}
                    partner={tool.partner}
                    onPress={() => {}}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  paddingH: {
    paddingHorizontal: spacing.lg,
  },
  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  headerIconWrap: {
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontWeight: '600',
  },
  // ── Callout ─────────────────────────────────────────────────────────
  callout: {
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  calloutIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutTextStack: {
    flex: 1,
    gap: spacing.xs,
  },
  // ── Progress ────────────────────────────────────────────────────────
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // ── Tools ───────────────────────────────────────────────────────────
  toolsCarouselOuter: {},
  toolsCarousel: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  toolCardWrap: {
    width: 280,
  },
});
