import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import mobileAds, { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';

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
    let unsubClosed = null;
    let appStateSub = null;
    let isAdShowing = false;
    let isSdkInitialized = false;
    let lastAppOpenAdTime = 0;
    const APP_OPEN_COOLDOWN_MS = 5 * 60 * 1000; // 5 Minutes Frequency Cap

    const loadAndShowAppOpenAd = () => {
      const now = Date.now();
      if (lastAppOpenAdTime > 0 && now - lastAppOpenAdTime < APP_OPEN_COOLDOWN_MS) {
        return;
      }

      try {
        if (!appOpenAd) {
          appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN, {
            requestNonPersonalizedAdsOnly: false,
          });

          unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
            if (!isAdShowing) {
              const checkTime = Date.now();
              if (lastAppOpenAdTime === 0 || checkTime - lastAppOpenAdTime >= APP_OPEN_COOLDOWN_MS) {
                isAdShowing = true;
                lastAppOpenAdTime = checkTime;
                appOpenAd.show().catch((err) => {
                  isAdShowing = false;
                  console.log('[AdMob] App Open Ad show error:', err.message);
                });
              }
            }
          });

          unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
            isAdShowing = false;
            console.log('[AdMob] App Open Ad load error:', error.message);
          });

          unsubClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
            isAdShowing = false;
          });
        }
        appOpenAd.load();
      } catch (err) {
        console.log('[AdMob] App Open Ad init exception:', err.message);
      }
    };

    // Initialize Google Mobile Ads SDK first, then load App Open Ad
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log('[AdMob] Google Mobile Ads SDK Initialized successfully', adapterStatuses);
        isSdkInitialized = true;
        loadAndShowAppOpenAd();
      })
      .catch((err) => {
        console.log('[AdMob] SDK Initialization error:', err.message);
      });

    // Listen for background -> foreground transition
    const { AppState } = require('react-native');
    let prevAppState = AppState.currentState;
    appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (prevAppState.match(/inactive|background/) && nextAppState === 'active') {
        if (isSdkInitialized && !isAdShowing) {
          loadAndShowAppOpenAd();
        }
      }
      prevAppState = nextAppState;
    });

    return () => {
      if (unsubLoaded) unsubLoaded();
      if (unsubError) unsubError();
      if (unsubClosed) unsubClosed();
      if (appStateSub) appStateSub.remove();
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
