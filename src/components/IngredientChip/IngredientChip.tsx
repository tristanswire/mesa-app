import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { typography } from '../../theme';

export interface IngredientChipProps {
  label: string;
  theme?: 'dark' | 'light';
}

// In Cook Mode body text the ingredient is now a highlighter mark, not a pill.
// We render a nested <Text> so the background flows inline with the prose and
// wraps naturally across line breaks. Font weight matches surrounding body
// (500) — no bold, no border-radius, no alignSelf hacks.
export function IngredientChip({ label, theme = 'dark' }: IngredientChipProps) {
  const highlightStyle = theme === 'dark' ? styles.highlightDark : styles.highlightLight;

  // No internal padding — the parent body's segment strings already carry
  // surrounding whitespace (e.g. "Heat " + chip + " in a pan"), so adding
  // spaces here would double-space. The highlight reads tight by design,
  // matching a textmark / highlighter marking a phrase.
  return <RNText style={[styles.label, highlightStyle]}>{label}</RNText>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.cookModeBody.fontFamily,
    fontSize: typography.cookModeBody.fontSize,
    fontWeight: '500',
    lineHeight: typography.cookModeBody.lineHeight,
  },
  // Terracotta @ 25% over Pine — passive textmark, not a button
  highlightDark: {
    backgroundColor: 'rgba(138, 58, 30, 0.25)',
    color: '#F7F2EA',
  },
  // Clay @ 40% over Cream
  highlightLight: {
    backgroundColor: 'rgba(201, 143, 99, 0.4)',
    color: '#1F1C19',
  },
});
