import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';
import { StatusBar } from 'expo-status-bar';

type Nav = NativeStackNavigationProp<OnboardingStackParamList>;

export function ValuePropScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>ONBOARDING / STEP 1</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Value Prop</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: ValueProp</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="Next →"
          onPress={() => navigation.navigate('AhaMoment')}
        />
      </View>
    </SafeAreaView>
    </>
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
