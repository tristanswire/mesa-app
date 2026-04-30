import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureGuestUser } from './src/data/user';
import { useDatabaseMigrations } from './src/db/migrate';
import { seedMockRecipesIfEmpty } from './src/db/seed';
import { linking } from './src/navigation/linking';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { success: migrationsReady, error: migrationsError } = useDatabaseMigrations();
  const [seedReady, setSeedReady] = useState(false);

  useEffect(() => {
    if (!migrationsReady) return;
    (async () => {
      await ensureGuestUser();
      await seedMockRecipesIfEmpty();
      setSeedReady(true);
    })();
  }, [migrationsReady]);

  if (migrationsError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cream,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ textAlign: 'center' }}>{`Database error: ${migrationsError.message}`}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !migrationsReady || !seedReady) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
