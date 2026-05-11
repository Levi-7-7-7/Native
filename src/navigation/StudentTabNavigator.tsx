/**
 * StudentTabNavigator.tsx  (final version)
 *
 * Uses FCM (real push) instead of polling.
 * useFcmToken()  — registers the device token with the backend on login.
 * Firebase handles background delivery automatically once the token is saved.
 */
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import UploadCertificateScreen from '../screens/UploadCertificateScreen';
import {useFcmToken} from '../utils/useFcmToken';

const Tab = createBottomTabNavigator();
type TabBarIconProps = {color: string; size: number};

export default function StudentTabNavigator() {
  const {colors} = useTheme();

  // Register this device's FCM token with the backend.
  // From this point on, the backend sends push notifications directly
  // via Firebase when a tutor approves or rejects a certificate —
  // no polling needed.
  useFcmToken();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({color, size}: TabBarIconProps) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Certificates"
        component={CertificatesScreen}
        options={{
          tabBarIcon: ({color, size}: TabBarIconProps) => (
            <MaterialCommunityIcons name="certificate-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadCertificateScreen}
        options={{
          tabBarLabel: 'Upload',
          tabBarIcon: ({color, size}: TabBarIconProps) => (
            <MaterialCommunityIcons name="upload-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
