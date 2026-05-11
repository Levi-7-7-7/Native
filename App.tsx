/**
 * App.tsx
 *
 * Notification tap handling — three cases:
 *
 * 1. App OPEN (foreground):
 *    notifee.onForegroundEvent() fires → navigate to Certificates tab.
 *
 * 2. App BACKGROUNDED — user taps FCM notification:
 *    messaging().onNotificationOpenedApp() fires → navigate to Certificates.
 *
 * 3. App KILLED — user taps FCM notification to cold-start:
 *    messaging().getInitialNotification() resolves with the notification
 *    → navigate after a short delay for the navigator to mount.
 *
 * Note: notifee.onBackgroundEvent() is only needed if you display Notifee
 * notifications in the background (we don't — FCM handles that natively).
 * It's kept here as a required no-op because Notifee throws without it.
 */
import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, {EventType} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

// // Required by Notifee — must be at module level
// notifee.onBackgroundEvent(async () => {});

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationPending = useRef(false); // store intent

  const goToCertificates = () => {
    if (!navigationRef.current?.isReady()) {
      notificationPending.current = true;
      return;
    }
  const currentRoute = navigationRef.current.getCurrentRoute()?.name;
    // Only navigate if we're already inside the student stack
    if (currentRoute && currentRoute !== 'Login' && currentRoute !== 'VerifyOtp') {
      try {
        navigationRef.current.navigate('StudentApp', { screen: 'Certificates' });
      } catch (e) {
        console.warn('[Nav] Navigate failed:', e);
      }
    }
  };

  useEffect(() => {
    const unsubNotifee = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) goToCertificates();
    });

    const unsubFcm = messaging().onNotificationOpenedApp(() => {
      goToCertificates();
    });

    // Cold start — store intent, navigate when navigator is ready
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        notificationPending.current = true;
      }
    });

    return () => {
      unsubNotifee();
      unsubFcm();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      <AuthProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // ✅ Navigator is mounted — now safe to navigate
            if (notificationPending.current) {
              notificationPending.current = false;
              goToCertificates();
            }
          }}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 
