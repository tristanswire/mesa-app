import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';

type Props = { currentStep: 0 | 1 | 2 };

export function ProgressDots({ currentStep }: Props) {
  return (
    <View style={styles.container}>
      {([0, 1, 2] as const).map((i) => (
        <View
          key={i}
          style={[styles.dot, i === currentStep && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(31, 28, 25, 0.2)',
  },
  dotActive: {
    width: 6,
    backgroundColor: colors.terracotta,
  },
});
