import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Camera, ChevronLeft, ChevronRight, Link, Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideProps } from 'lucide-react-native';
import { ClipboardBanner } from '../../components/ClipboardBanner';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type LucideIcon = React.ComponentType<LucideProps>;

const MOCK_CLIPBOARD_URL = 'nytimes.com/cooking/recipes/harissa-roasted-carrots';

function OptionRow({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.6 }]}
    >
      <Icon size={20} color={colors.ink} strokeWidth={1.5} />
      <Text role="body" style={styles.optionLabel}>{label}</Text>
      <ChevronRight size={20} color={colors.oliveDark} strokeWidth={1.5} />
    </Pressable>
  );
}

export function ImportScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showBanner = !bannerDismissed;

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* ── Header row ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <IconButton
              icon={ChevronLeft}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Close import"
              size="md"
            />
          </View>
          <Text role="body" style={styles.headerTitle}>Import a Recipe</Text>
          <View style={styles.headerSide} />
        </View>

        {/* ── Subheadline ──────────────────────────────────────────── */}
        <View style={{ height: spacing.base }} />
        <Text role="caption" color="oliveDark" align="center" style={styles.subheadline}>
          Paste a link, snap a photo, or type it in.
        </Text>

        {/* ── Clipboard banner ─────────────────────────────────────── */}
        {showBanner && (
          <View style={[styles.paddingH, { marginTop: spacing.lg }]}>
            <ClipboardBanner
              url={MOCK_CLIPBOARD_URL}
              onImport={() => { /* TODO Phase 3: import from detected URL */ }}
              onDismiss={() => setBannerDismissed(true)}
            />
          </View>
        )}

        {/* ── URL input ────────────────────────────────────────────── */}
        <View style={[styles.paddingH, { marginTop: spacing.md }]}>
          <Input
            value={url}
            onChangeText={setUrl}
            placeholder="Paste a recipe link…"
            icon={Link}
            keyboardType="url"
            returnKeyType="go"
            accessibilityLabel="Recipe URL"
          />
        </View>

        {/* ── OR divider ───────────────────────────────────────────── */}
        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text role="caption" color="oliveDark" style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── Option rows ──────────────────────────────────────────── */}
        <View style={styles.paddingH}>
          <OptionRow
            icon={Camera}
            label="Take a Photo"
            onPress={() => { /* TODO Phase 3: launch camera */ }}
          />
          <View style={{ height: spacing.md }} />
          <OptionRow
            icon={Pencil}
            label="Enter Manually"
            onPress={() => { /* TODO Phase 3: open manual entry */ }}
          />
        </View>

        {/* ── Supported sites footer ───────────────────────────────── */}
        <View style={{ height: spacing.xl }} />
        <Pressable
          onPress={() => { /* TODO Phase 3: supported sites info screen */ }}
          style={({ pressed }) => [styles.footerLink, pressed && { opacity: 0.6 }]}
        >
          <Text role="caption" color="terracotta" align="center">
            Mesa supports most recipe sites.
          </Text>
        </Pressable>
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
    paddingVertical: spacing.md,
  },
  headerSide: {
    width: 44,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  subheadline: {
    paddingHorizontal: spacing.lg,
  },
  // ── OR divider ──────────────────────────────────────────────────────
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.oat,
  },
  orText: {
    letterSpacing: 1,
  },
  // ── Option rows ─────────────────────────────────────────────────────
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.md,
  },
  optionLabel: {
    flex: 1,
  },
  // ── Footer ──────────────────────────────────────────────────────────
  footerLink: {
    paddingVertical: spacing.xs,
  },
});
