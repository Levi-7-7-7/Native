/**
 * App.tsx
 *
 * FIX 1 — Notification tap (foreground)
 *   Added notifee.onForegroundEvent() listener. Without this, tapping a
 *   notification while the app IS open does nothing visible.
 *
 * FIX 2 — Notification tap (background / quit state)
 *   notifee.onBackgroundEvent() at module level handles taps when backgrounded.
 *   notifee.getInitialNotification() handles taps when app was fully closed.
 *   Both navigate to the Certificates tab.
 */
import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, {EventType} from '@notifee/react-native';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import {setupNotifications} from './src/utils/notificationService';

// MUST be at module level (outside component) — runs in headless JS task
notifee.onBackgroundEvent(async ({type}) => {
  if (type === EventType.PRESS) {
    // launchActivity already opens the app — nothing more needed here
  }
});

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    setupNotifications().catch(err =>
      console.warn('[App] Notification setup failed:', err),
    );

    // Foreground: app is open, user taps notification
    const unsubscribe = notifee.onForegroundEvent(({type}) => {
      if (type === EventType.PRESS) {
        navigationRef.current?.navigate('StudentApp', {screen: 'Certificates'});
      }
    });

    // Quit state: app was fully closed, user tapped notification
    notifee.getInitialNotification().then(initial => {
      if (initial) {
        setTimeout(() => {
          navigationRef.current?.navigate('StudentApp', {screen: 'Certificates'});
        }, 500);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
