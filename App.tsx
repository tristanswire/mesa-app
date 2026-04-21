import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, User, Bookmark, Link as LinkIcon } from 'lucide-react-native';
import { colors, radii, spacing, typography } from './src/theme';
import type { ColorToken, SpacingToken, TypographyRole } from './src/theme';
import {
  AffiliateCard,
  Button,
  ClipboardBanner,
  FAB,
  FeatureCard,
  IconButton,
  IngredientChip,
  Input,
  PrepChecklistItem,
  ProgressBar,
  RecipeCard,
  SectionLabel,
  StepCard,
  TabBar,
  Text,
  TimerToken,
} from './src/components';

// ─── Token showcase data ────────────────────────────────────────────────────

const COLOR_TOKENS = Object.keys(colors) as ColorToken[];
const SPACING_TOKENS = Object.keys(spacing) as SpacingToken[];
const TYPE_SAMPLES: { role: TypographyRole; sample: string }[] = [
  { role: 'display', sample: 'Mesa' },
  { role: 'headline', sample: 'Design system — smoke test' },
  { role: 'sectionLabel', sample: 'Section Label' },
  { role: 'body', sample: 'The quick brown fox jumps over the lazy dog.' },
  { role: 'caption', sample: 'Caption — metadata, timestamps, secondary info' },
  { role: 'cookModeBody', sample: 'Add the pasta and cook for 9 minutes.' },
  { role: 'cookModeStepNumber', sample: '03' },
  { role: 'cookModeIngredientChip', sample: '200g pasta' },
];

// ─── Showcase sub-sections ──────────────────────────────────────────────────

function Divider() {
  return <View style={{ height: spacing.xl }} />;
}

function SectionGap() {
  return <View style={{ height: spacing.md }} />;
}

// ─── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Local state for interactive component showcases
  const [inputValue, setInputValue] = useState('');
  const [inputWithIconValue, setInputWithIconValue] = useState('https://');
  const [checklist, setChecklist] = useState([
    { label: 'Dice the onion finely', duration: '5 min', checked: false },
    { label: 'Brown the butter until nutty', checked: true },
    { label: 'Season with salt and white pepper', duration: '1 min', checked: false },
  ]);
  const [activeTab, setActiveTab] = useState('home');

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <Text role="display">Mesa</Text>
          <View style={{ height: spacing.md }} />
          <Text role="headline">Component library — Phase 1</Text>
          <View style={{ height: spacing.sm }} />
          <Text role="caption">Scroll to inspect all 16 components against the V2 spec.</Text>

          {/* ══ TOKEN FOUNDATIONS ═══════════════════════════════════════ */}

          <Divider />
          <SectionLabel>COLOR TOKENS</SectionLabel>
          <SectionGap />
          <View style={styles.swatchRow}>
            {COLOR_TOKENS.map((token) => (
              <View key={token} style={styles.swatchItem}>
                <View
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: colors[token],
                      borderWidth: token === 'white' ? 1 : 0,
                      borderColor: colors.oat,
                    },
                  ]}
                />
                <RNText style={styles.swatchLabel}>{token}</RNText>
              </View>
            ))}
          </View>

          <Divider />
          <SectionLabel>TYPOGRAPHY</SectionLabel>
          {TYPE_SAMPLES.map(({ role, sample }) => {
            const spec = typography[role];
            const isCookMode = role.startsWith('cookMode');
            return (
              <View
                key={role}
                style={[styles.typeRow, isCookMode && { backgroundColor: colors.pine }]}
              >
                <Text role={role}>{sample}</Text>
                <RNText style={styles.roleLabel}>{role}</RNText>
              </View>
            );
          })}

          <Divider />
          <SectionLabel>SPACING</SectionLabel>
          <SectionGap />
          {SPACING_TOKENS.map((token) => {
            const value = spacing[token];
            return (
              <View key={token} style={styles.spacingRow}>
                <RNText style={styles.spacingLabel}>{token} — {value}pt</RNText>
                <View
                  style={[
                    styles.spacingBar,
                    { height: Math.max(value, 4), width: value * 3 },
                  ]}
                />
              </View>
            );
          })}

          {/* ══ COMPONENT SHOWCASE ══════════════════════════════════════ */}

          {/* ── 1. BUTTONS ─────────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>BUTTONS</SectionLabel>
          <SectionGap />
          <Button variant="primary" label="Start Cooking" onPress={() => {}} />
          <View style={{ height: spacing.sm }} />
          <Button variant="secondary" label="Save Recipe" onPress={() => {}} />
          <View style={{ height: spacing.sm }} />
          <Button variant="primary" label="Disabled" onPress={() => {}} disabled />
          <View style={{ height: spacing.sm }} />
          <View style={styles.row}>
            <Button
              variant="primary"
              label="Not full-width"
              onPress={() => {}}
              fullWidth={false}
            />
          </View>

          {/* ── 2. ICON BUTTONS ────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>ICON BUTTONS</SectionLabel>
          <SectionGap />
          <View style={styles.row}>
            <IconButton
              icon={Home}
              onPress={() => {}}
              size="sm"
              accessibilityLabel="Go home (small)"
            />
            <IconButton
              icon={Home}
              onPress={() => {}}
              size="md"
              accessibilityLabel="Go home (medium)"
            />
            <IconButton
              icon={Home}
              onPress={() => {}}
              size="lg"
              accessibilityLabel="Go home (large)"
            />
            <IconButton
              icon={Bookmark}
              onPress={() => {}}
              variant="filled"
              accessibilityLabel="Bookmark (filled)"
            />
            <View style={{ backgroundColor: colors.pine, borderRadius: radii.pill }}>
              <IconButton
                icon={Home}
                onPress={() => {}}
                tint="cream"
                accessibilityLabel="Go home (on pine)"
              />
            </View>
          </View>

          {/* ── 3. INPUTS ──────────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>INPUTS</SectionLabel>
          <SectionGap />
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Search recipes…"
            accessibilityLabel="Search recipes"
          />
          <View style={{ height: spacing.sm }} />
          <Input
            value={inputWithIconValue}
            onChangeText={setInputWithIconValue}
            placeholder="Paste a recipe URL"
            icon={LinkIcon}
            keyboardType="url"
            returnKeyType="go"
            accessibilityLabel="Recipe URL input"
          />

          {/* ── 4. RECIPE CARDS ────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>RECIPE CARDS</SectionLabel>
          <SectionGap />
          <RecipeCard
            variant="hero"
            title="Cacio e Pepe"
            duration="25 min"
            tag="Weeknight"
            label="LAST COOKED"
            ctaLabel="Cook Again →"
            onPress={() => {}}
          />
          <View style={{ height: spacing.md }} />
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <RecipeCard
                variant="grid"
                title="Brown Butter Chocolate Chip Cookies"
                duration="45 min"
                tag="Dessert"
                onPress={() => {}}
              />
            </View>
            <View style={styles.gridItem}>
              <RecipeCard
                variant="grid"
                title="Roasted Carrot Soup"
                duration="50 min"
                tag="Vegetarian"
                onPress={() => {}}
              />
            </View>
          </View>

          {/* ── 5. COOK MODE STEP ──────────────────────────────────────── */}
          <Divider />
          <SectionLabel>COOK MODE STEP</SectionLabel>

          {/* Dark card 1 — inactive TimerToken */}
          <SectionGap />
          <StepCard
            stepNumber={2}
            totalSteps={5}
            theme="dark"
            content={
              <Text role="cookModeBody" color="cream">
                Heat{' '}
                <IngredientChip label="2 tbsp olive oil" theme="dark" />
                {' '}in a large pan over medium heat, then add{' '}
                <IngredientChip label="3 cloves garlic" theme="dark" />
                {' '}and cook for{' '}
                <TimerToken label="bake 18 min" durationSeconds={1080} theme="dark" isActive={false} />
                {' '}until fragrant.
              </Text>
            }
            nextPreview="Add the tomatoes and stir to combine."
          />

          {/* Dark card 2 — active TimerToken */}
          <View style={{ height: spacing.md }} />
          <StepCard
            stepNumber={3}
            totalSteps={5}
            theme="dark"
            content={
              <Text role="cookModeBody" color="cream">
                Add{' '}
                <IngredientChip label="1 cup broth" theme="dark" />
                {' '}and{' '}
                <IngredientChip label="1 tsp salt" theme="dark" />
                {', '}then simmer for{' '}
                <TimerToken label="17:42" durationSeconds={1062} theme="dark" isActive />
                {'.'}
              </Text>
            }
            nextPreview="Stir in the cream and reduce heat to low."
          />
          <View style={{ height: spacing.sm }} />
          <Text role="caption" color="oliveDark">
            Timer token — inactive (top) vs. active (bottom)
          </Text>

          {/* Light card — dark/light theme comparison */}
          <View style={{ height: spacing.md }} />
          <StepCard
            stepNumber={1}
            totalSteps={3}
            theme="light"
            content={
              <Text role="cookModeBody" color="ink">
                Bring a large pot of salted water to a boil. Add{' '}
                <IngredientChip label="200g pasta" theme="light" />
                {' '}and cook for{' '}
                <TimerToken label="9 min" durationSeconds={540} theme="light" isActive={false} />
                .
              </Text>
            }
            nextPreview="Drain and reserve 1 cup of pasta water."
          />

          {/* ── 6. PREP CHECKLIST ──────────────────────────────────────── */}
          <Divider />
          <SectionLabel>PREP CHECKLIST</SectionLabel>
          <View style={styles.checklistContainer}>
            {checklist.map((item, index) => (
              <PrepChecklistItem
                key={item.label}
                label={item.label}
                duration={item.duration}
                checked={item.checked}
                onToggle={() => toggleChecklist(index)}
              />
            ))}
          </View>

          {/* ── 7. PROGRESS BAR ────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>PROGRESS BAR</SectionLabel>
          <SectionGap />
          <Text role="caption">0%</Text>
          <View style={{ height: spacing.xs }} />
          <ProgressBar progress={0} />
          <View style={{ height: spacing.md }} />
          <Text role="caption">40%</Text>
          <View style={{ height: spacing.xs }} />
          <ProgressBar progress={0.4} />
          <View style={{ height: spacing.md }} />
          <Text role="caption">100%</Text>
          <View style={{ height: spacing.xs }} />
          <ProgressBar progress={1} />
          <View style={{ height: spacing.md }} />
          <Text role="caption">Olive tint</Text>
          <View style={{ height: spacing.xs }} />
          <ProgressBar progress={0.65} tint="olive" height={8} />

          {/* ── 8. TAB BAR ─────────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>TAB BAR</SectionLabel>
          <SectionGap />
          <View style={styles.tabBarContainer}>
            <TabBar
              tabs={[
                { key: 'home', label: 'Home', icon: Home },
                { key: 'recipes', label: 'Recipes', icon: Bookmark },
                { key: 'profile', label: 'Profile', icon: User },
              ]}
              activeKey={activeTab}
              onTabPress={setActiveTab}
            />
          </View>

          {/* ── 9. FEATURE CARD ────────────────────────────────────────── */}
          <Divider />
          <SectionLabel>FEATURE CARD</SectionLabel>
          <SectionGap />
          <FeatureCard
            icon={LinkIcon}
            subtitle="ONE LINK · ZERO SCROLLING"
            title="Import any recipe"
            body="Paste a URL from any cooking site and Mesa strips the ads, the life story, and the auto-play video."
            onPress={() => {}}
          />

          {/* ── 10. AFFILIATE CARDS ────────────────────────────────────── */}
          <Divider />
          <SectionLabel>AFFILIATE CARDS</SectionLabel>
          <SectionGap />
          <AffiliateCard
            productName="Lodge 10.25-Inch Cast Iron Skillet"
            price="$34"
            partner="Amazon"
            onPress={() => {}}
          />
          <View style={{ height: spacing.md }} />
          <AffiliateCard
            productName="Microplane Premium Zester Grater"
            price="$18"
            partner="Sur La Table"
            onPress={() => {}}
          />

          {/* ── 11. CLIPBOARD BANNER ───────────────────────────────────── */}
          <Divider />
          <SectionLabel>CLIPBOARD BANNER</SectionLabel>
          <SectionGap />
          <ClipboardBanner
            url="https://www.seriouseats.com/perfect-pan-seared-chicken-thighs"
            onImport={() => {}}
            onDismiss={() => {}}
          />

          <View style={{ height: spacing.huge }} />
        </ScrollView>

        {/* FAB — fixed overlay */}
        <FAB
          onPress={() => {}}
          accessibilityLabel="Add new recipe"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  // Token showcase styles
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatchItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
  },
  swatchLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.oliveDark,
    textAlign: 'center',
  },
  typeRow: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.sm,
    gap: 2,
  },
  roleLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.clay,
    marginTop: 2,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  spacingLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.oliveDark,
    width: 110,
  },
  spacingBar: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    flex: 1,
    marginLeft: spacing.md,
  },
  // Component showcase styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  checklistContainer: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.oat,
  },
  tabBarContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.oat,
  },
});
