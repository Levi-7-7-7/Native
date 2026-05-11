/**
 * useFcmToken.ts
 *
 * Gets the Firebase Cloud Messaging token for this device and
 * registers it with your backend (PATCH /students/fcm-token).
 *
 * Call this hook once inside StudentTabNavigator (alongside the
 * existing useCertificateNotifications call — or replace it entirely
 * since FCM handles background delivery now).
 *
 * Requires:
 *   npm install @react-native-firebase/app @react-native-firebase/messaging
 *   (see SETUP.md for google-services.json / GoogleService-Info.plist steps)
 */
import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';

const FCM_TOKEN_KEY = 'fcm_device_token';

export function useFcmToken() {
  useEffect(() => {
    const registerToken = async () => {
      try {
        // Request permission (iOS — Android grants automatically)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        // Get the FCM token for this device
        const token = await messaging().getToken();
        if (!token) return;

        // Only POST to backend if token changed (avoids redundant calls)
        const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (cached === token) return;

        await axiosInstance.patch('/students/fcm-token', {fcmToken: token});
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      } catch (err) {
        console.warn('[FCM] Token registration failed:', err);
      }
    };

    registerToken();

    // FCM tokens can rotate — refresh whenever Firebase issues a new one
    const unsubscribe = messaging().onTokenRefresh(async newToken => {
      try {
        await axiosInstance.patch('/students/fcm-token', {fcmToken: newToken});
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      } catch (err) {
        console.warn('[FCM] Token refresh failed:', err);
      }
    });

    return () => unsubscribe();
  }, []);
}
