import { Check } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABELS,
  type RecipeCategory,
} from '../../data/recipes';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

export interface CategoryPickerSheetProps {
  visible: boolean;
  value: RecipeCategory | null;
  onSelect: (category: RecipeCategory | null) => void;
  onClose: () => void;
}

// Bottom-sheet category picker. iOS-only app, so the Modal slide animation
// reads as a native sheet. A tap on the backdrop dismisses without changing
// the selection; tapping any row commits and closes in one gesture (no
// secondary "Save" button per spec).
export function CategoryPickerSheet({
  visible,
  value,
  onSelect,
  onClose,
}: CategoryPickerSheetProps) {
  const insets = useSafeAreaInsets();

  const handlePick = (category: RecipeCategory | null) => {
    onSelect(category);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Dismiss category picker"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <Text role="headline" style={styles.title}>Category</Text>
        {RECIPE_CATEGORIES.map((c, idx) => {
          const selected = c === value;
          return (
            <Pressable
              key={c}
              onPress={() => handlePick(c)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={RECIPE_CATEGORY_LABELS[c]}
              style={({ pressed }) => [
                styles.row,
                idx === RECIPE_CATEGORIES.length - 1 && styles.rowLast,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text role="body" style={styles.label}>
                {RECIPE_CATEGORY_LABELS[c]}
              </Text>
              {selected ? <Check size={20} color={colors.terracotta} strokeWidth={2} /> : null}
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => handlePick(null)}
          accessibilityRole="button"
          accessibilityLabel="Remove category"
          style={({ pressed }) => [styles.removeRow, pressed && { opacity: 0.6 }]}
        >
          <Text role="body" color="terracotta">Remove category</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.oat,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  removeRow: {
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
});
