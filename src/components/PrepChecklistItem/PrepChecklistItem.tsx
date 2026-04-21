import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

export interface PrepChecklistItemProps {
  label: string;
  duration?: string;
  checked: boolean;
  onToggle: () => void;
}

export function PrepChecklistItem({
  label,
  duration,
  checked,
  onToggle,
}: PrepChecklistItemProps) {
  const crossoutOpacity = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(crossoutOpacity, {
      toValue: checked ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [checked, crossoutOpacity]);

  const handleToggle = async () => {
    await Haptics.selectionAsync();
    onToggle();
  };

  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.row}
    >
      {/* Checkbox */}
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
        ]}
      >
        {checked && (
          <Check size={14} color={colors.cream} strokeWidth={2} />
        )}
      </View>

      {/* Label */}
      <Animated.View style={[styles.labelContainer, { opacity: crossoutOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.55],
      })}]}>
        <Text
          role="body"
          color={checked ? 'oliveDark' : 'ink'}
          style={checked ? styles.strikethrough : undefined}
        >
          {label}
        </Text>
      </Animated.View>

      {/* Duration pill */}
      {duration && (
        <Animated.View style={[styles.pill, { opacity: crossoutOpacity.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.5],
        })}]}>
          <Text role="caption" color="oliveDark">{duration}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.oliveDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  labelContainer: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  pill: {
    backgroundColor: colors.oat,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    flexShrink: 0,
  },
});
