/**
 * useFcmToken.ts
 *
 * Does three things:
 * 1. Gets the FCM device token and registers it with the backend
 * 2. Shows a LOCAL Notifee notification when a FCM message arrives
 *    while the app is in the FOREGROUND (FCM doesn't show UI then)
 * 3. Handles token refresh
 *
 * Background/killed delivery is handled entirely by FCM + the
 * FirebaseMessagingService declared in AndroidManifest.xml.
 */
import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import {setupNotifications, showCertificateNotification} from './notificationService';

const FCM_TOKEN_KEY = 'fcm_device_token';

export function useFcmToken() {
  useEffect(() => {
    // Step 1: Setup channel + permissions
    setupNotifications().catch(console.warn);

    // Step 2: Register device token with backend
    const registerToken = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;

        const token = await messaging().getToken();
        if (!token) return;

        const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (cached === token) return;

        await axiosInstance.patch('/students/fcm-token', {fcmToken: token});
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('[FCM] Token registered');
      } catch (err) {
        console.warn('[FCM] Token registration failed:', err);
      }
    };

    registerToken();

    // Step 3: Show local notification when FCM arrives in FOREGROUND
    // (FCM suppresses its own notification UI when app is open)
    const unsubForeground = messaging().onMessage(async remoteMessage => {
      const status = remoteMessage.data?.status as 'approved' | 'rejected' | undefined;
      const title = remoteMessage.notification?.title || 'Certificate Update';
      const body  = remoteMessage.notification?.body  || '';
      if (status) {
        await showCertificateNotification({title, body, status});
      }
    });

    // Step 4: Handle token rotation
    const unsubRefresh = messaging().onTokenRefresh(async newToken => {
      try {
        await axiosInstance.patch('/students/fcm-token', {fcmToken: newToken});
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      } catch (err) {
        console.warn('[FCM] Token refresh failed:', err);
      }
    });

    return () => {
      unsubForeground();
      unsubRefresh();
    };
  }, []);
}
