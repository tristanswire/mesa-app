import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '../../components/IconButton';
import { Text } from '../../components/Text';
import { spacing } from '../../theme';

export function PreferenceEditHeader({ title }: { title: string }) {
  const navigation = useNavigation();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <IconButton
          icon={ChevronLeft}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          size="md"
        />
      </View>
      <Text role="body" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  side: {
    width: 44,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
});
