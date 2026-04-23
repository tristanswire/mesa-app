import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface SettingRowProps {
  icon?: LucideIcon;
  label: string;
  onPress: () => void;
  isLast?: boolean;
  variant?: 'list' | 'card';
}

export function SettingRow({
  icon: Icon,
  label,
  onPress,
  isLast = false,
  variant = 'list',
}: SettingRowProps) {
  const isCard = variant === 'card';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isCard ? styles.card : styles.list,
        !isCard && !isLast && styles.listBorder,
        pressed && { opacity: 0.6 },
      ]}
    >
      {Icon && (
        <Icon size={20} color={colors.ink} strokeWidth={1.5} />
      )}
      <Text role="body" style={styles.label}>{label}</Text>
      <ChevronRight size={20} color={colors.oliveDark} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // variant="list" — transparent bg, bottom border, label flush left
  list: {
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  listBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
  },
  // variant="card" — oat bg, rounded, standalone
  card: {
    backgroundColor: colors.oat,
    borderRadius: radii.md,
    padding: spacing.base,
    gap: spacing.md,
  },
  label: {
    flex: 1,
  },
});
