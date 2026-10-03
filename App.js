import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';

import { AD_UNIT_IDS, ADS_ENABLED } from './src/services/adConfig';
import { lightTheme } from './src/theme';
import { initNotificationService } from './src/services/notificationManager';

import HomeScreen from './src/screens/HomeScreen';
import DownloadScreen from './src/screens/DownloadScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightTheme.background,
    card: lightTheme.surface,
    border: lightTheme.border,
    primary: '#E1306C',
    text: lightTheme.text,
  },
};

const TAB_ICONS = {
  Home: { active: 'home', inactive: 'home-outline' },
  Downloads: { active: 'download', inactive: 'download-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

function AppTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#E1306C',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarPressColor: 'transparent',
        tabBarPressOpacity: 0.7,
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[props.style, { overflow: 'hidden' }]}
          />
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] || { active: 'cube', inactive: 'cube-outline' };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Downloads" component={DownloadScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initNotificationService();

    if (!ADS_ENABLED) return;

    let appOpenAd = null;
    let unsubLoaded = null;
    let unsubError = null;

    try {
      appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN, {});

      unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        appOpenAd.show().catch((err) => {
          console.log('[AdMob] App Open Ad show error:', err.message);
        });
      });

      unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('[AdMob] App Open Ad load error:', error.message);
      });

      appOpenAd.load();
    } catch (err) {
      console.log('[AdMob] App Open Ad init exception:', err.message);
    }

    return () => {
      if (unsubLoaded) unsubLoaded();
      if (unsubError) unsubError();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={appTheme}>
        <StatusBar style="dark" />
        <AppTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
