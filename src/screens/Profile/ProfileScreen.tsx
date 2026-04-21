import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';
import type { MainStackParamList, RootStackParamList } from '../../navigation/types';

// ProfileScreen needs two navigation scopes:
// - MainStackParamList for Showcase (within Main stack)
// - RootStackParamList for Onboarding (root-level route)
type MainNav = NativeStackNavigationProp<MainStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const mainNav = useNavigation<MainNav>();
  const rootNav = useNavigation<RootNav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>MAIN / TABS</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Profile</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: Profile</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="Component Showcase"
          onPress={() => mainNav.navigate('Showcase')}
        />
        <View style={{ height: spacing.sm }} />
        {/* Temporary — removed in Phase 3 when first-launch gate ships */}
        <Button
          variant="secondary"
          label="Open Onboarding"
          onPress={() => rootNav.navigate('Onboarding')}
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
