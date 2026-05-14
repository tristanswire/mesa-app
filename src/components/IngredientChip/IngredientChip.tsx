import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { colors, typography } from '../../theme';

export interface IngredientChipProps {
  label: string;
  theme?: 'dark' | 'light';
}

// Ingredient tokens in Cook Mode read as inline prose — no pill, no background,
// no border — just a Terracotta color shift to mark the noun phrase. Font
// weight matches surrounding body (500) so the token doesn't bold or change
// shape relative to the prose.
export function IngredientChip({ label }: IngredientChipProps) {
  return <RNText style={styles.label}>{label}</RNText>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.cookModeBody.fontFamily,
    fontSize: typography.cookModeBody.fontSize,
    fontWeight: '500',
    lineHeight: typography.cookModeBody.lineHeight,
    color: colors.terracotta,
  },
});
