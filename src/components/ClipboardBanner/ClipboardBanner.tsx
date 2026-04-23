import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';

export interface ClipboardBannerProps {
  url: string;
  onImport: () => void;
  onDismiss?: () => void;
}

export function ClipboardBanner({ url, onImport, onDismiss }: ClipboardBannerProps) {
  return (
    <View style={styles.banner}>
      {/* Link icon */}
      <Link size={20} color={colors.oliveDark} strokeWidth={1.5} />

      {/* Text stack */}
      <View style={styles.textStack}>
        <Text role="body" style={styles.title}>
          Link detected
        </Text>
        <Text role="caption" numberOfLines={1} style={styles.url}>
          {url}
        </Text>
      </View>

      {/* Import button — compact */}
      <View style={styles.actions}>
        <Pressable
          onPress={onImport}
          accessibilityRole="button"
          accessibilityLabel="Import link"
          style={({ pressed }) => [styles.importBtn, pressed && styles.importBtnPressed]}
        >
          <Text role="caption" color="cream" style={styles.importLabel}>
            Import
          </Text>
        </Pressable>
        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss link banner"
            style={styles.dismissBtn}
          >
            <Text role="caption" color="oliveDark">✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Terracotta border at 20% opacity to draw the eye
    borderWidth: 1,
    borderColor: 'rgba(138, 58, 30, 0.20)',
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  url: {
    // Caption style, but slightly muted
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  importBtn: {
    backgroundColor: colors.terracotta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  importBtnPressed: {
    opacity: 0.8,
  },
  importLabel: {
    fontWeight: '600',
  },
  dismissBtn: {
    padding: spacing.xs,
  },
});
