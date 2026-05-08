import React from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface SettingRowProps {
  icon?: LucideIcon;
  label: string;
  isLast?: boolean;
  variant?: 'list' | 'card' | 'toggle';
  // For variant !== 'toggle'
  onPress?: () => void;
  // For variant === 'toggle'
  value?: boolean;
  onValueChange?: (next: boolean) => void;
}

export function SettingRow({
  icon: Icon,
  label,
  onPress,
  isLast = false,
  variant = 'list',
  value = false,
  onValueChange,
}: SettingRowProps) {
  const isCard = variant === 'card';
  const isToggle = variant === 'toggle';

  const content = (
    <>
      {Icon && <Icon size={20} color={colors.ink} strokeWidth={1.5} />}
      <Text role="body" style={styles.label}>{label}</Text>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.oat, true: colors.terracotta }}
          thumbColor={colors.cream}
          ios_backgroundColor={colors.oat}
        />
      ) : (
        <ChevronRight size={20} color={colors.oliveDark} strokeWidth={1.5} />
      )}
    </>
  );

  // Toggle rows: tapping the row also flips the switch
  if (isToggle) {
    return (
      <Pressable
        onPress={() => onValueChange?.(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.base,
          styles.list,
          !isLast && styles.listBorder,
          pressed && { opacity: 0.6 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

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
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  list: {
    paddingVertical: spacing.base,
    gap: spacing.md,
  },
  listBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
  },
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
