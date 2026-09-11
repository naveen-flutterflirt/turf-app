import { Redirect } from 'expo-router';
import { useAppStore } from '../stores/useAppStore';

export default function RootIndex() {
  const { hasSeenOnboarding, isAuthenticated, userRole } = useAppStore();

  // Force onboarding screen for testing
  // return <Redirect href="/(onboarding)" />;


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
