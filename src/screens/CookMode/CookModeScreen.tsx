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

export function CookModeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    // Pine background previews the Cook Mode dark surface
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel color="clay">MAIN / FULL-SCREEN</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display" color="cream">Cook Mode</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="creamMuted">route: CookMode</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="secondary"
          label="Finish Cooking →"
          onPress={() => navigation.navigate('PostCook', { recipeId: 'mock-recipe-1' })}
        />
        <View style={{ height: spacing.sm }} />
        <Button
          variant="secondary"
          label="Light variant →"
          onPress={() => navigation.navigate('CookModeLight', { recipeId: 'mock-recipe-1' })}
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
  safe: { flex: 1, backgroundColor: colors.pine },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
