import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

export function AhaMomentScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>ONBOARDING / STEP 2</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Aha Moment</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: AhaMoment</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="Next →"
          onPress={() => navigation.navigate('Preferences')}
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
