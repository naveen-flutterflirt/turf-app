import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import '../global.css';

import { ApiProvider } from '../context/ApiContext';
import { AlertProvider } from '../context/AlertContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LogBox } from 'react-native';

const queryClient = new QueryClient();

// Disable Reanimated strict mode to hide the spammy "Reading from value during component render" warnings
// which are usually caused by third-party navigation or gesture libraries in development mode.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Completely hide all warning and error overlays on the mobile screen during testing
LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <AlertProvider>
          {/* Status bar overlays the app */}
          <StatusBar
            barStyle="light-content"
            translucent={true}
            backgroundColor="transparent"
          />

          {/* Removed explicit Stack.Screen children to let Expo Router auto-discover 
              and prevent the "extraneous route" warnings for booking-summary etc. */}
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AlertProvider>
      </ApiProvider>
    </QueryClientProvider>
  );
}