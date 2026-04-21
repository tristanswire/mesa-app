import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
} from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme';

type LucideIcon = React.ComponentType<LucideProps>;

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  accessibilityLabel?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  autoFocus,
  keyboardType,
  returnKeyType,
  accessibilityLabel,
}: InputProps) {
  return (
    <View style={styles.container}>
      {Icon && (
        <Icon
          size={20}
          color={colors.oliveDark}
          strokeWidth={1.5}
          style={styles.icon}
        />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.oliveDark}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          Icon ? styles.inputWithIcon : undefined,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.oat,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.base,
  },
  icon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.ink,
    paddingVertical: spacing.base,
  },
  inputWithIcon: {
    // No extra styling needed — icon handles the gap via marginRight
  },
});
