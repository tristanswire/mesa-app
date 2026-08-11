import type { LucideProps } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

type LucideIcon = React.ComponentType<LucideProps>;

export interface ActionSheetItem {
  label: string;
  icon?: LucideIcon;
  /** Terracotta label + icon, for irreversible actions. */
  destructive?: boolean;
  onPress: () => void;
}

export interface ActionSheetProps {
  visible: boolean;
  title?: string;
  items: ActionSheetItem[];
  onClose: () => void;
  cancelLabel?: string;
}

// Generic bottom-sheet menu, shaped like CategoryPickerSheet so the two read as
// the same surface: Cream sheet, Oat dividers, backdrop tap to dismiss.
//
// A picked action does NOT run inline — it's held until the modal has finished
// dismissing (Modal.onDismiss on iOS). An Alert fired while the sheet is still
// on screen would try to present on top of a view controller that's mid-dismiss
// and get dropped, which is exactly what "Delete Recipe" needs to do.
export function ActionSheet({
  visible,
  title,
  items,
  onClose,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const pendingAction = useRef<(() => void) | null>(null);

  const handlePick = (item: ActionSheetItem) => {
    pendingAction.current = item.onPress;
    onClose();
    // Android never fires onDismiss — run it on the next tick instead.
    if (Platform.OS !== 'ios') {
      const action = pendingAction.current;
      pendingAction.current = null;
      action?.();
    }
  };

  const handleDismissed = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={handleDismissed}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Dismiss menu"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        {title ? (
          <Text role="headline" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        ) : null}
        {items.map((item, idx) => {
          const Icon = item.icon;
          const tint = item.destructive ? colors.terracotta : colors.ink;
          return (
            <Pressable
              key={item.label}
              onPress={() => handlePick(item)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.row,
                idx === items.length - 1 && styles.rowLast,
                pressed && { opacity: 0.6 },
              ]}
            >
              {Icon ? <Icon size={20} strokeWidth={1.5} color={tint} /> : null}
              <Text role="body" color={item.destructive ? 'terracotta' : 'ink'}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={({ pressed }) => [styles.cancelRow, pressed && { opacity: 0.6 }]}
        >
          <Text role="body" color="oliveDark">{cancelLabel}</Text>
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
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.oat,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cancelRow: {
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
});
