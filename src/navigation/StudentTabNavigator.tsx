import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import UploadCertificateScreen from '../screens/UploadCertificateScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import {useTheme} from '../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();

function TabBar({state, navigation}: any) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

const icons: Record<string, string> = {
  Dashboard: 'view-dashboard-outline',
  Upload: 'cloud-upload-outline',
  Certificates: 'certificate-outline',
};

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="button">
            <Icon
              name={icons[route.name] || 'circle-outline'}
              size={24}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {color: isFocused ? colors.primary : colors.textMuted},
                isFocused && styles.tabLabelActive,
              ]}>
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
    borderTopWidth: 1,
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
    minHeight: 52,
    paddingVertical: 4,
  },
  tabIcon: {fontSize: 22, marginBottom: 4, opacity: 0.4},
  tabLabel: {fontSize: 11, fontWeight: '600'},
  tabLabelActive: {fontWeight: '700'},
});
