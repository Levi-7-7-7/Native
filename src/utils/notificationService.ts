/**
 * notificationService.ts
 *
 * Handles LOCAL (foreground) notifications via Notifee.
 * FCM delivers notifications in background/killed state automatically
 * through react-native-firebase — no Notifee needed for that path.
 *
 * This file is called by useFcmToken.ts when a FCM message arrives
 * while the app IS in the foreground (FCM suppresses its own UI then).
 */
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
} from '@notifee/react-native';

export const CHANNEL_ID = 'certificate_status';

export async function setupNotifications(): Promise<void> {
  // Create the Android notification channel (idempotent — safe to call every launch)
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Certificate Status',
    description: 'Notifies you when a certificate is approved or rejected.',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    lights: true,
  });

  // Request permission — needed for iOS and Android 13+
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    console.warn('[Notifications] Permission not granted');
  }
}

export async function showCertificateNotification(params: {
  title: string;
  body: string;
  status: 'approved' | 'rejected';
}): Promise<void> {
  await notifee.displayNotification({
    title: params.title,
    body: params.body,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_stat_notification',
      color: params.status === 'approved' ? '#16a34a' : '#dc2626',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
    ios: {
      sound: 'default',
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
}
