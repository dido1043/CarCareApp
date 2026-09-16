import { initI18n } from '@/i18n';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { usePreferences } from '@/store/preferences';
import { colors } from '@/theme';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Held until fonts, translations and the stored session are all ready, so the
// app never flashes an unstyled or half-authenticated frame.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void initI18n().then(() => setI18nReady(true));
  }, []);

  // A missing font should degrade to the system face, not block the app.
  const ready = (fontsLoaded || Boolean(fontError)) && i18nReady;

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The route guard. Unauthenticated users are held in `(auth)`; authenticated
 * ones are pushed out of it. Navigation only happens once both the session and
 * the persisted preferences have been read, otherwise the first frame would
 * bounce the user between the two groups.
 */
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const isHydrated = usePreferences((state) => state.isHydrated);
  const segments = useSegments();
  const router = useRouter();

  const ready = !isLoading && isHydrated;

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [ready, isAuthenticated, segments, router]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="onboarding/vehicle"
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack>
  );
}
