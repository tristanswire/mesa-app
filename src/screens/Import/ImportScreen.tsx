import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';
import type { MainStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function ImportScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>MAIN / MODAL</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Import</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: Import</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="Import Recipe →"
          onPress={() => {
            navigation.goBack();
            // Phase 3: trigger actual import here
          }}
        />
        <View style={{ height: spacing.sm }} />
        <Button
          variant="secondary"
          label="Dismiss"
          onPress={() => navigation.goBack()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
