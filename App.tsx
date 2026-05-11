/**
 * App.tsx  (updated)
 *
 * Added: calls setupNotifications() on first render to create the Android
 * notification channel and request iOS permission.
 */
import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import {setupNotifications} from './src/utils/notificationService';

export default function App() {
  useEffect(() => {
    // Set up notification channel (Android) and request permission (iOS).
    // Safe to call on every app start — channel creation is idempotent.
    setupNotifications().catch(err =>
      console.warn('[App] Notification setup failed:', err),
    );
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
