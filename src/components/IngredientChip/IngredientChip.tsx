import React from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

export interface IngredientChipProps {
  label: string;
  theme?: 'dark' | 'light';
}

export function IngredientChip({ label, theme = 'dark' }: IngredientChipProps) {
  const fg = theme === 'dark' ? colors.pine : colors.ink;

  return (
    // View-in-Text: on iOS, a <View> as a direct child of <Text> renders inline and
    // RN centers it on the line height when no transform is applied. alignSelf:'center'
    // keeps the chip baseline-aligned with surrounding text across line wraps.
    <View style={[styles.chip, { backgroundColor: colors.oat }]}>
      <RNText style={[styles.label, { color: fg }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'center',
  },
  label: {
    fontFamily: typography.cookModeIngredientChip.fontFamily,
    fontSize: typography.cookModeIngredientChip.fontSize,
    fontWeight: '700',
    lineHeight: 20,
  },
});
