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
    // View-in-Text: on iOS, a <View> as a direct child of <Text> renders inline at the
    // text baseline. Views always honor borderRadius + padding — unlike nested <Text>
    // nodes where borderRadius clipping is inconsistent across RN versions.
    <View style={[styles.chip, { backgroundColor: colors.oat }]}>
      <RNText style={[styles.label, { color: fg }]}>{label}</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    transform: [{ translateY: 8 }],
  },
  label: {
    fontFamily: typography.cookModeIngredientChip.fontFamily,
    fontSize: typography.cookModeIngredientChip.fontSize,
    fontWeight: '700',
    lineHeight: 20,
  },
});
