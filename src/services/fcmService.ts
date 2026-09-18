// @ts-ignore - The module works at runtime but TS definitions sometimes lack default export
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export const initFCM = async (baseUrl: string, userToken: string) => {
  if (!userToken) return;

  try {
    // 1. Request Permission (Required for iOS, Android 13+)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM Permission denied');
      return;
    }

    // 2. Get the token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token generated:', fcmToken);

      // 3. Send token to backend
      const response = await fetch(`${baseUrl}/notifications/fcm-token`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          fcm_token: fcmToken,
          device_type: Platform.OS,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to sync FCM Token to backend. Status:', response.status);
      } else {
        console.log('FCM Token successfully synced to backend');
      }
    }
  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
};

// Handle foreground messages
export const setupForegroundListener = () => {
  return messaging().onMessage(async (remoteMessage: any) => {
    console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));
    // TODO: You can hook this into AlertProvider or toast notifications later if needed.
  });
};
