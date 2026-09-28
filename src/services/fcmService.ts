import { Platform } from 'react-native';

let getMessaging: any = null;
let AuthorizationStatus: any = null;

try {
  // Using require inside try-catch prevents the app from crashing in Expo Go
  // where native Firebase modules are not registered.
  const fbm = require('@react-native-firebase/messaging');
  getMessaging = fbm.getMessaging;
  AuthorizationStatus = fbm.AuthorizationStatus;
} catch (e) {
  console.warn('Firebase Messaging native module not found. Push notifications will not work in this environment (e.g., Expo Go).');
}

// Register background handler early to silence the warning
if (getMessaging) {
  try {
    getMessaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Message handled in the background!', remoteMessage?.messageId);
    });
  } catch (e) {
    // Ignore if messaging isn't ready
  }
}

export const initFCM = async (baseUrl: string, userToken: string) => {
  if (!userToken || !getMessaging) return;

  try {
    const messaging = getMessaging();
    
    // 1. Request Permission (Required for iOS, Android 13+)
    const authStatus = await messaging.requestPermission();
    
    // AuthorizationStatus.AUTHORIZED is 1, PROVISIONAL is 2
    const enabled =
      authStatus === AuthorizationStatus?.AUTHORIZED ||
      authStatus === AuthorizationStatus?.PROVISIONAL;

    if (!enabled) {
      console.log('FCM Permission denied');
      return;
    }

    // 2. Get the token
    const fcmToken = await messaging.getToken();
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
  if (!getMessaging) {
    // Return a dummy unsubscribe function
    return () => {};
  }
  
  const messaging = getMessaging();
  return messaging.onMessage(async (remoteMessage: any) => {
    console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));
    
    // Show an alert so the user actually sees the notification while the app is open!
    if (remoteMessage?.notification) {
      const { title, body } = remoteMessage.notification;
      if (title || body) {
        // Need to import Alert from react-native at the top or use it directly here
        const { Alert } = require('react-native');
        Alert.alert(title || 'New Notification', body || '');
      }
    }
  });
};
