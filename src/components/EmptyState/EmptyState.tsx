import type { LucideProps } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Icon size={32} strokeWidth={1.5} color={colors.terracotta} />
      </View>
      <View style={{ height: spacing.md }} />
      <Text role="display" align="center">{title}</Text>
      <View style={{ height: spacing.sm }} />
      <Text role="body" color="oliveDark" align="center" style={styles.description}>
        {description}
      </Text>
      {ctaLabel && onCta && (
        <>
          <View style={{ height: spacing.xl }} />
          <Button variant="primary" label={ctaLabel} onPress={onCta} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    maxWidth: 280,
  },
});
