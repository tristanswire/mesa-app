import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { SectionLabel } from '../SectionLabel';
import { Text } from '../Text';

export interface StepCardProps {
  stepNumber: number;
  totalSteps: number;
  content: React.ReactNode;
  nextPreview?: string;
  theme?: 'dark' | 'light';
}

export function StepCard({
  stepNumber,
  totalSteps,
  content,
  nextPreview,
  theme = 'dark',
}: StepCardProps) {
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.darkCard : styles.lightCard,
      ]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <SectionLabel color={isDark ? 'clay' : 'clay'}>
          {`STEP ${stepNumber} OF ${totalSteps}`}
        </SectionLabel>
        <Text
          role="cookModeStepNumber"
          color={isDark ? 'creamMuted' : 'clay'}
        >
          {String(stepNumber).padStart(2, '0')}
        </Text>
      </View>

      {/* Step content — ReactNode allows inline IngredientChip + TimerToken */}
      <View style={styles.body}>
        {content}
      </View>

      {/* Next preview */}
      {nextPreview && (
        <View style={styles.nextPreview}>
          <SectionLabel color={isDark ? 'clay' : 'clay'}>NEXT</SectionLabel>
          <View style={{ height: spacing.xs }} />
          <Text role="caption" color={isDark ? 'creamMuted' : 'oliveDark'}>
            {nextPreview}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  darkCard: {
    backgroundColor: colors.pine,
  },
  lightCard: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.oat,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  body: {
    marginBottom: spacing.md,
  },
  nextPreview: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(247, 242, 234, 0.12)',
  },
});
