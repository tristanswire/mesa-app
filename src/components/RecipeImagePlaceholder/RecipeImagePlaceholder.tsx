import { UtensilsCrossed } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

export interface RecipeImagePlaceholderProps {
  // Optional aspectRatio for callers (RecipeCard grid + hero) that size the
  // image area by ratio. Omit to let the placeholder fill its parent via
  // flex: 1 (RecipeDetail hero, where the parent View sets the aspectRatio).
  aspectRatio?: number;
}

// Recipe fallback hero. Renders an Oat (#E9DDCF) field with a centered
// Terracotta UtensilsCrossed glyph. Used wherever a recipe has no imageUrl
// or where the image failed to load (onError → render this).
export function RecipeImagePlaceholder({ aspectRatio }: RecipeImagePlaceholderProps) {
  return (
    <View
      style={[
        styles.container,
        aspectRatio !== undefined ? { aspectRatio } : undefined,
      ]}
    >
      <UtensilsCrossed size={40} strokeWidth={1.5} color={colors.terracotta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
