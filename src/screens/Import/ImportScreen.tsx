import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Camera, ChevronLeft, Link, Pencil, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { ClipboardBanner } from '../../components/ClipboardBanner';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import {
  importRecipeFromPhoto,
  importRecipeFromUrl,
  type ImportResult,
} from '../../data/import';
import { useClipboardUrl } from '../../hooks/useClipboardUrl';
import { captureRecipePhoto, type PhotoSource } from '../../lib/photoImport';
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
  // The hint under an error is mode-specific — "Try a different link" is wrong
  // advice for a photo that came back unreadable.
  const [importError, setImportError] = useState<{ message: string; hint: string } | null>(null);

  const { url: clipboardUrl, loaded: clipboardLoaded } = useClipboardUrl();
  const showBanner =
    clipboardLoaded && !!clipboardUrl && !bannerDismissed && !isImporting && !importError;

  /**
   * Shared landing for every import mode: same loading state, same error
   * surface, same navigation reset, so a photo import is indistinguishable
   * from a URL import once the request is in flight.
   */
  const runImport = async (importer: () => Promise<ImportResult>, errorHint: string) => {
    if (isImporting) return;
    setIsImporting(true);
    setImportError(null);
    const result = await importer();
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
      setImportError({ message: result.error, hint: errorHint });
    }
  };

  const handleImport = (urlToImport: string) => {
    if (!urlToImport.trim()) return;
    return runImport(() => importRecipeFromUrl(urlToImport.trim()), 'Try a different link.');
  };

  /**
   * Capture happens before the loading overlay goes up — the picker and the
   * permission prompt are their own modal UI, and a spinner behind them would
   * be both invisible and wrong if the user cancels.
   */
  const handlePhoto = async (source: PhotoSource) => {
    if (isImporting) return;
    const photo = await captureRecipePhoto(source);

    if (photo.status === 'cancelled') return;
    if (photo.status === 'error') {
      setImportError({ message: photo.message, hint: 'Try a clearer, well-lit shot.' });
      return;
    }

    await runImport(
      () => importRecipeFromPhoto(photo.base64),
      'Try a clearer, well-lit shot.',
    );
  };

  const showPhotoOptions = () => {
    if (isImporting) return;
    // iOS-only app (see app.json), so the native sheet is the right affordance.
    // Guarded anyway so a future Android target degrades to the library picker
    // rather than silently doing nothing.
    if (Platform.OS !== 'ios') {
      void handlePhoto('library');
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Take Photo', 'Choose from Library'],
        cancelButtonIndex: 0,
        title: 'Import from a photo',
        message: 'Photograph a cookbook page or recipe card.',
      },
      (buttonIndex) => {
        if (buttonIndex === 1) void handlePhoto('camera');
        else if (buttonIndex === 2) void handlePhoto('library');
      },
    );
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
                  <Text role="body" style={styles.errorTitle}>{importError.message}</Text>
                  <Text role="caption" color="oliveDark" style={{ marginTop: spacing.xs }}>
                    {importError.hint}
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

          {/* ── OR divider ───────────────────────────────────────────── */}
          <View style={[styles.paddingH, styles.dividerRow, { marginTop: spacing.xl }]}>
            <View style={styles.dividerLine} />
            <Text role="caption" color="oliveDark" style={styles.dividerLabel}>
              OR
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Photo + manual entry ─────────────────────────────────── */}
          <View style={[styles.paddingH, { marginTop: spacing.lg }]}>
            <Button
              variant="secondary"
              icon={Camera}
              label="Take a Photo"
              onPress={showPhotoOptions}
              disabled={isImporting}
            />
            <View style={{ height: spacing.md }} />
            <Button
              variant="secondary"
              icon={Pencil}
              label="Enter Manually"
              onPress={() => navigation.navigate('ManualImport')}
              disabled={isImporting}
            />
          </View>

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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.oat,
  },
  dividerLabel: {
    letterSpacing: 0.5,
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
