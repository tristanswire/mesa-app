import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Flame } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AffiliateCard } from '../../components/AffiliateCard';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { PrepChecklistItem } from '../../components/PrepChecklistItem';
import { ProgressBar } from '../../components/ProgressBar';
import { SectionLabel } from '../../components/SectionLabel';
import { Text } from '../../components/Text';
import { useRecipeDetail } from '../../data/hooks';
import { getUserPreferences, type MeasurementSystem } from '../../data/preferences';
import { convertTemperatures } from '../../lib/units';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, shadows, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'PrepMode'>;

export function PrepModeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const { data: recipe, loading } = useRecipeDetail(route.params.recipeId);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Prep labels are free text. Only temperatures are converted — quantities can
  // appear mid-sentence ("Measure out 2 cups flour") where a rewrite is far more
  // likely to mangle the label than to help.
  const [system, setSystem] = useState<MeasurementSystem>('imperial');
  useEffect(() => {
    let cancelled = false;
    getUserPreferences()
      .then((prefs) => {
        if (!cancelled) setSystem(prefs.measurementSystem);
      })
      .catch((e) => console.error('[prepmode] failed to read measurement pref', e));
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-initialize the checked state when navigating between recipes — keyed on recipe id
  // so PrepMode resets cleanly across screens.
  useEffect(() => {
    if (!recipe) return;
    const initial = Object.fromEntries(
      recipe.prepItems.filter((i) => i.defaultChecked).map((i) => [i.id, true]),
    );
    setCheckedItems(initial);
  }, [recipe?.id]);

  useEffect(() => {
    if (!loading && !recipe) {
      navigation.goBack();
    }
  }, [loading, recipe, navigation]);

  if (loading || !recipe) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  const prepItems = recipe.prepItems;
  // Max 2 affiliate cards per surface (matches PostCook).
  const tools = recipe.tools.slice(0, 2);
  const hasNoPrep = prepItems.length === 0;

  if (hasNoPrep) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: insets.top + spacing.base }]}>
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
          <View style={styles.headerIconWrap} />
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyFlame}>
            <Flame size={28} color={colors.terracotta} strokeWidth={1.5} />
          </View>
          <Text role="display" align="center">No prep needed.</Text>
          <View style={{ height: spacing.sm }} />
          <Text role="body" color="oliveDark" align="center" style={styles.emptySubtitle}>
            Heat up your tools and let&apos;s go.
          </Text>
        </View>

        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
          ]}
        >
          <Button
            variant="primary"
            label="Begin Cooking →"
            onPress={() => {
              navigation.push('CookMode', { recipeId: recipe.id });
            }}
          />
        </View>
      </View>
    );
  }

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
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.base, paddingBottom: spacing.xxl },
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
                label={convertTemperatures(item.label, system)}
                duration={item.duration ?? undefined}
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
                    toolId={tool.id}
                    recipeId={recipe.id}
                    affiliateUrl={tool.affiliateUrl}
                    source="prep_mode"
                  />
                </View>
              ))}
            </ScrollView>
            <View style={[styles.paddingH, styles.disclosureWrap]}>
              <Text role="caption" color="oliveDark" align="center">
                Affiliate links help keep Mesa ad-free.
              </Text>
            </View>
          </>
        )}

      </ScrollView>

      {/* ── Persistent bottom CTA ──────────────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg },
        ]}
      >
        <Button
          variant="primary"
          label="Begin Cooking →"
          onPress={() => {
            navigation.push('CookMode', { recipeId: recipe.id });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  bottomBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.oat,
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
  disclosureWrap: {
    marginTop: spacing.md,
  },
  // ── Empty state ─────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyFlame: {
    marginBottom: spacing.lg,
  },
  emptySubtitle: {
    maxWidth: 280,
  },
});
