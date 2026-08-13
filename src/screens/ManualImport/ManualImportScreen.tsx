import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Text } from '../../components/Text';
import { MAX_MANUAL_TEXT_CHARS, importRecipeFromText } from '../../data/import';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/**
 * The counter is noise for a normal paste — it appears only once the user is
 * within striking distance of the cap, so it reads as a warning rather than a
 * running tally.
 */
const COUNTER_VISIBLE_AT = 15_000;

/** ~10 visible lines at the body line height, so the field reads as a page. */
const MIN_INPUT_HEIGHT = 240;

export function ManualImportScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const trimmed = text.trim();
  const showCounter = text.length >= COUNTER_VISIBLE_AT;
  const atLimit = text.length >= MAX_MANUAL_TEXT_CHARS;

  const handleImport = async () => {
    if (!trimmed || isImporting) return;
    setIsImporting(true);
    setImportError(null);
    const result = await importRecipeFromText(trimmed);
    setIsImporting(false);

    if (result.success) {
      // Same landing as the URL and photo paths: reset so Back from the new
      // recipe returns to the library, not into the import flow.
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Tabs' },
            { name: 'RecipeDetail', params: { recipeId: result.recipeId } },
          ],
        }),
      );
    } else {
      setImportError(result.error);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
            ]}
          >
            {/* ── Header row ─────────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerSide}>
                <IconButton
                  icon={ChevronLeft}
                  onPress={() => navigation.goBack()}
                  accessibilityLabel="Back"
                  size="md"
                />
              </View>
              <Text role="body" style={styles.headerTitle}>
                Enter Manually
              </Text>
              <View style={styles.headerSide} />
            </View>

            <View style={styles.paddingH}>
              <View style={{ height: spacing.base }} />
              <Text role="headline">Type or paste your recipe</Text>

              <View style={{ height: spacing.sm }} />
              <Text role="caption" color="oliveDark">
                Paste from anywhere — Mesa will structure it for you.
              </Text>

              {/* ── Recipe text field ────────────────────────────────── */}
              <View style={{ height: spacing.lg }} />
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={
                  'Paste the full recipe here — title, ingredients, and steps.\n\nFormatting does not matter.'
                }
                placeholderTextColor={colors.oliveDark}
                multiline
                textAlignVertical="top"
                maxLength={MAX_MANUAL_TEXT_CHARS}
                editable={!isImporting}
                scrollEnabled={false}
                accessibilityLabel="Recipe text"
                style={styles.input}
              />

              {/* Counter appears only near the cap — see COUNTER_VISIBLE_AT. */}
              {showCounter && (
                <View style={styles.counterRow}>
                  <Text role="caption" color={atLimit ? 'terracotta' : 'oliveDark'}>
                    {atLimit
                      ? `Character limit reached (${MAX_MANUAL_TEXT_CHARS.toLocaleString()})`
                      : `${text.length.toLocaleString()} / ${MAX_MANUAL_TEXT_CHARS.toLocaleString()}`}
                  </Text>
                </View>
              )}

              {/* ── Import ───────────────────────────────────────────── */}
              <View style={{ height: spacing.lg }} />
              <Button
                variant="primary"
                label="Import"
                onPress={handleImport}
                disabled={!trimmed || isImporting}
              />

              {/* ── Error sheet ──────────────────────────────────────── */}
              {importError && (
                <View style={{ marginTop: spacing.md }}>
                  <View style={styles.errorSheet}>
                    <View style={styles.errorTextStack}>
                      <Text role="body" style={styles.errorTitle}>
                        {importError}
                      </Text>
                      <Text role="caption" color="oliveDark" style={{ marginTop: spacing.xs }}>
                        Check the text and try again.
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Loading overlay — matches the URL import path ──────────── */}
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
  flex: {
    flex: 1,
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
  input: {
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    minHeight: MIN_INPUT_HEIGHT,
    padding: spacing.base,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    lineHeight: 24,
    color: colors.ink,
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
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
