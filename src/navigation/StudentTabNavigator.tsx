import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import UploadCertificateScreen from '../screens/UploadCertificateScreen';
import CertificatesScreen from '../screens/CertificatesScreen';

const Tab = createBottomTabNavigator();

function TabBar({state, descriptors, navigation}: any) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Upload: '📤',
    Certificates: '📋',
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="button">
            <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
              {icons[route.name] || '•'}
            </Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Upload" component={UploadCertificateScreen} />
      <Tab.Screen name="Certificates" component={CertificatesScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    // FIX: Android gesture nav bar sits below the tab bar — paddingBottom: 20 was always
    // overlapping it on gesture-nav devices, making the bar feel cramped and hard to tap.
    // Use a larger value on Android to clear the nav bar.
    paddingBottom: Platform.OS === 'android' ? 8 : 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52, // FIX: ensure minimum Android touch target height
    paddingVertical: 4,
  },
  tabIcon: {fontSize: 22, marginBottom: 4, opacity: 0.4},
  tabIconActive: {opacity: 1},
  tabLabel: {fontSize: 11, color: '#9ca3af', fontWeight: '600'},
  tabLabelActive: {color: '#1e3a8a'},
});
