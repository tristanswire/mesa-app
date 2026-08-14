import { Camera, UtensilsCrossed } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { colors, spacing } from '../../theme';

export interface RecipeImagePlaceholderProps {
  // Optional aspectRatio for callers (RecipeCard grid + hero) that size the
  // image area by ratio. Omit to let the placeholder fill its parent via
  // flex: 1 (RecipeDetail hero, where the parent View sets the aspectRatio).
  aspectRatio?: number;
  /**
   * Opt-in "Add a photo" affordance. Off by default so the grid cards keep the
   * plain glyph — an add-photo prompt on every card in a library would be
   * noise, and those cards aren't tappable for that action anyway.
   */
  showAddPhoto?: boolean;
}

// Recipe fallback hero. Renders an Oat (#E9DDCF) field with a centered
// Terracotta UtensilsCrossed glyph. Used wherever a recipe has no imageUrl
// or where the image failed to load (onError → render this).
export function RecipeImagePlaceholder({
  aspectRatio,
  showAddPhoto = false,
}: RecipeImagePlaceholderProps) {
  return (
    <View
      style={[
        styles.container,
        aspectRatio !== undefined ? { aspectRatio } : undefined,
      ]}
    >
      {showAddPhoto ? (
        // Olive Dark on Oat (5.0:1) — passes AA for the caption and the 3:1
        // non-text minimum for the icon.
        <View style={styles.addPhoto}>
          <Camera size={28} strokeWidth={1.5} color={colors.oliveDark} />
          <Text role="caption" color="oliveDark" align="center">
            Add a photo
          </Text>
        </View>
      ) : (
        <UtensilsCrossed size={40} strokeWidth={1.5} color={colors.terracotta} />
      )}
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
  addPhoto: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
