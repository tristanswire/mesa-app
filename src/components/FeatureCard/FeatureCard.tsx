import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radii, shadows, spacing } from '../../theme';
import { SectionLabel } from '../SectionLabel';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  body: string;
  onPress?: () => void;
}

export function FeatureCard({ icon: Icon, title, subtitle, body, onPress }: FeatureCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={`${title}: ${body}`}
      style={({ pressed }) => [
        styles.card,
        onPress && pressed && styles.pressed,
      ]}
      disabled={!onPress}
    >
      {/* Icon badge */}
      <View style={styles.iconBadge}>
        <Icon size={20} color={colors.ink} strokeWidth={1.5} />
      </View>

      <View style={{ height: spacing.md }} />

      {/* Subtitle (sectionLabel, terracotta) */}
      <SectionLabel color="terracotta">{subtitle}</SectionLabel>

      <View style={{ height: spacing.xs }} />

      {/* Title */}
      <Text role="body" style={styles.title}>
        {title}
      </Text>

      <View style={{ height: spacing.sm }} />

      {/* Body */}
      <Text role="body" color="oliveDark">
        {body}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.oat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 18,
  },
  pressed: {
    opacity: 0.85,
  },
});
