/**
 * notificationService.ts  (fixed)
 *
 * Two fixes vs the previous version:
 *
 * FIX 1 — smallIcon
 *   Changed from 'ic_notification' to 'ic_stat_notification'.
 *   Android notification icons MUST be white-on-transparent silhouettes.
 *   The file must live at:
 *     android/app/src/main/res/drawable/ic_stat_notification.png
 *   See ICON_GUIDE below for exact pixel sizes.
 *   If the file doesn't exist, Notifee falls back to the launcher icon,
 *   which Android renders as a white blob — that's the wrong icon you saw.
 *
 * FIX 2 — pressAction
 *   Added launchActivity: 'default' so tapping the notification calls
 *   startActivity() with FLAG_ACTIVITY_SINGLE_TOP, which brings the
 *   existing MainActivity to the front instead of creating a new instance.
 *   Without this, Android creates a second Activity → splash animation
 *   re-runs → the glitch you saw.
 */

import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';

export const CHANNEL_ID = 'certificate_status';

export async function setupNotifications(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Certificate Status',
    description: 'Notifies you when a certificate is approved or rejected.',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    lights: true,
  });

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
    body:  params.body,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,

      // FIX 1: use ic_stat_notification (white silhouette PNG in drawable/)
      // If you haven't created the file yet, temporarily use
      // smallIcon: '@mipmap/ic_launcher' to unblock yourself, but the icon
      // will render as a white blob on Android — create the proper icon ASAP.
      smallIcon: 'ic_stat_notification',

      color: params.status === 'approved' ? '#16a34a' : '#dc2626',

      // FIX 2: launchActivity: 'default' tells Notifee to call
      // startActivity with the existing task — no new Activity created,
      // no splash screen, no glitch.
      pressAction: {
        id: 'default',
        launchActivity: 'default',   // ← this is the key fix for the glitch
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

/**
 * ICON GUIDE — ic_stat_notification.png
 * ───────────────────────────────────────────────────────────────────────────
 * Android requires notification icons to be WHITE pixels on a TRANSPARENT
 * background. Any colour is ignored — the OS tints it white automatically.
 *
 * Create a simple white silhouette (e.g. a certificate/document shape) and
 * export at these sizes, placing each file in the matching folder:
 *
 *   android/app/src/main/res/drawable-mdpi/ic_stat_notification.png    24×24 px
 *   android/app/src/main/res/drawable-hdpi/ic_stat_notification.png    36×36 px
 *   android/app/src/main/res/drawable-xhdpi/ic_stat_notification.png   48×48 px
 *   android/app/src/main/res/drawable-xxhdpi/ic_stat_notification.png  72×72 px
 *   android/app/src/main/res/drawable-xxxhdpi/ic_stat_notification.png 96×96 px
 *
 * Quick option: use Android Asset Studio (free, browser-based):
 *   https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
 *   → upload your logo → it generates all 5 sizes as a ZIP → extract into res/
 * ───────────────────────────────────────────────────────────────────────────
 */
