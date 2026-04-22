import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

const PLACEHOLDER_PALETTE = [
  colors.terracotta,
  colors.olive,
  colors.oliveDark,
  colors.pine,
  colors.clay,
];

const TINT_COLORS = {
  terracotta: colors.terracotta,
  olive: colors.olive,
} as const;

export interface RecipeImagePlaceholderProps {
  tintKey?: 'terracotta' | 'olive';
  title?: string;
  // When provided, the placeholder sizes itself via aspectRatio (RecipeCard usage).
  // When omitted, flex: 1 fills the parent container (RecipeDetailScreen hero usage).
  aspectRatio?: number;
}

export function RecipeImagePlaceholder({
  tintKey,
  title,
  aspectRatio,
}: RecipeImagePlaceholderProps) {
  const base = tintKey
    ? TINT_COLORS[tintKey]
    : PLACEHOLDER_PALETTE[
        (title ?? '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) %
          PLACEHOLDER_PALETTE.length
      ];

  return (
    <View
      style={[
        styles.container,
        aspectRatio !== undefined ? { aspectRatio } : undefined,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
      <View style={styles.stripeContainer} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[styles.stripe, { left: i * 24 - 48 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  stripeContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }, { scaleX: 2 }],
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});
