import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Link, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { ClipboardBanner } from '../../components/ClipboardBanner';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { importRecipeFromUrl } from '../../data/import';
import { useClipboardUrl } from '../../hooks/useClipboardUrl';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'Import'>;

export function ImportScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const prefilledUrl = route.params?.prefilledUrl;
  const [url, setUrl] = useState(prefilledUrl ?? '');

  // If prefilledUrl arrives after mount (re-entered the modal), seed the input.
  useEffect(() => {
    if (prefilledUrl) setUrl(prefilledUrl);
  }, [prefilledUrl]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { url: clipboardUrl, loaded: clipboardLoaded } = useClipboardUrl();
  const showBanner =
    clipboardLoaded && !!clipboardUrl && !bannerDismissed && !isImporting && !importError;

  const handleImport = async (urlToImport: string) => {
    if (!urlToImport.trim() || isImporting) return;
    setIsImporting(true);
    setImportError(null);
    const result = await importRecipeFromUrl(urlToImport.trim());
    setIsImporting(false);
    if (result.success) {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Tabs' },
            { name: 'RecipeDetail', params: { recipeId: result.recipeId } },
          ],
        })
      );
    } else {
      setImportError(result.error);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <ScrollView
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
            Paste a link from any recipe site.
          </Text>

          {/* ── Clipboard banner ─────────────────────────────────────── */}
          {showBanner && clipboardUrl && (
            <View style={[styles.paddingH, { marginTop: spacing.lg }]}>
              <ClipboardBanner
                url={clipboardUrl}
                onImport={() => handleImport(clipboardUrl)}
                onDismiss={() => setBannerDismissed(true)}
              />
            </View>
          )}

          {/* ── URL input ────────────────────────────────────────────── */}
          <View style={[styles.paddingH, { marginTop: spacing.lg }]}>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="Paste a recipe link…"
              icon={Link}
              keyboardType="url"
              returnKeyType="go"
              accessibilityLabel="Recipe URL"
            />
            <View style={{ height: spacing.md }} />
            <Button
              variant="primary"
              label="Import"
              onPress={() => handleImport(url)}
              disabled={!url.trim() || isImporting}
            />
          </View>

          {/* ── Error sheet ──────────────────────────────────────────── */}
          {importError && (
            <View style={[styles.paddingH, { marginTop: spacing.md }]}>
              <View style={styles.errorSheet}>
                <View style={styles.errorTextStack}>
                  <Text role="body" style={styles.errorTitle}>{importError}</Text>
                  <Text role="caption" color="oliveDark" style={{ marginTop: spacing.xs }}>
                    Try a different link.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setImportError(null)}
                  style={styles.errorDismiss}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error"
                >
                  <X size={18} color={colors.oliveDark} strokeWidth={1.5} />
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Supported sites footer ───────────────────────────────── */}
          <View style={{ height: spacing.xxl }} />
          <Text role="caption" color="terracotta" align="center">
            Mesa supports most recipe sites.
          </Text>
        </ScrollView>

        {/* ── Loading overlay ────────────────────────────────────────── */}
        {isImporting && (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <ActivityIndicator size="large" color={colors.terracotta} />
            <Text role="caption" color="oliveDark" style={{ marginTop: spacing.md }}>
              Reading the recipe…
            </Text>
          </View>
        )}
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
    paddingHorizontal: 0,
  },
  paddingH: {
    paddingHorizontal: spacing.lg,
  },
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
  errorSheet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  errorTextStack: {
    flex: 1,
  },
  errorTitle: {
    fontWeight: '600',
  },
  errorDismiss: {
    padding: spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 242, 234, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
