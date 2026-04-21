import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { FAB } from '../../components/FAB';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { SectionLabel } from '../../components/SectionLabel';
import { colors, spacing } from '../../theme';
import type { MainStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function RecipesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <SectionLabel>MAIN / TABS</SectionLabel>
        <View style={{ height: spacing.sm }} />
        <Text role="display">Recipes</Text>
        <View style={{ height: spacing.xs }} />
        <Text role="caption" color="oliveDark">route: Recipes</Text>
        <View style={{ height: spacing.xl }} />
        <Button
          variant="primary"
          label="View Recipe →"
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: 'mock-recipe-1' })}
        />
        <View style={{ height: spacing.sm }} />
        <Button
          variant="secondary"
          label="Open Import"
          onPress={() => navigation.navigate('Import')}
        />
      </View>
      <FAB
        onPress={() => navigation.navigate('Import')}
        accessibilityLabel="Import a recipe"
      />
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
