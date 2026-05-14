import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { colors, typography } from '../../theme';

export interface IngredientChipProps {
  label: string;
  theme?: 'dark' | 'light';
}

// Ingredient tokens in Cook Mode read as inline prose — no pill, no background,
// no border — just a color shift to mark the noun phrase. Color flips by surface
// so the token stays legible: Terracotta on cream, Clay on pine (Terracotta on
// pine is ~1.2:1 contrast, effectively invisible). Font weight matches
// surrounding body (500) so the token doesn't bold or change shape.
export function IngredientChip({ label, theme = 'light' }: IngredientChipProps) {
  const color = theme === 'dark' ? colors.clay : colors.terracotta;
  return <RNText style={[styles.label, { color }]}>{label}</RNText>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.cookModeBody.fontFamily,
    fontSize: typography.cookModeBody.fontSize,
    fontWeight: '500',
    lineHeight: typography.cookModeBody.lineHeight,
  },
});
