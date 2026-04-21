import { CommonActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';

export function PreferencesScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>ONBOARDING / STEP 3</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Preferences</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: Preferences</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="Get Started →"
          onPress={() =>
            navigation.dispatch(
              // Reset root stack to Main, removing Onboarding from history
              CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
            )
          }
        />
        <View style={{ height: spacing.sm }} />
        <Button
          variant="secondary"
          label="← Back"
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
