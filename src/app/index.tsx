import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAppStore } from '../stores/useAppStore';

export default function RootIndex() {
  const { hasSeenOnboarding, isAuthenticated, userRole, _hasHydrated } = useAppStore();

  // Force onboarding screen for testing
  // return <Redirect href="/(onboarding)" />;

  if (!_hasHydrated) {
    return <View className="flex-1 bg-turf-bg" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  if (isAuthenticated) {
    if (userRole === 'OWNER') {
      return <Redirect href={'/(owner-tabs)' as any} />;
    } else {
      return <Redirect href={'/(tabs)' as any} />;
    }
  }

  return <Redirect href="/(auth)/role-selection" />;
}
