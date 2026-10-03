import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { lightTheme, spacing, radius, typography } from '../theme';
import { getSettings, saveSettings } from '../services/storage';
import { AD_UNIT_IDS, ADS_ENABLED } from '../services/adConfig';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);

  const [settings, setSettingsState] = useState({
    themeMode: 'light',
    downloadFolder: 'InstaDownloader',
    autoSaveToGallery: true,
    notificationsEnabled: true,
  });

  const theme = lightTheme;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const stored = await getSettings();
    setSettingsState((prev) => ({ ...prev, ...stored }));
  };

  const handleToggleAutoSave = async (value) => {
    const updated = { ...settings, autoSaveToGallery: value };
    setSettingsState(updated);
    await saveSettings(updated);
  };

  const handleToggleNotifications = async (value) => {
    const updated = { ...settings, notificationsEnabled: value };
    setSettingsState(updated);
    await saveSettings(updated);
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://instadownloader.app/privacy').catch(() => {
      Alert.alert('Privacy Policy', 'Insta Downloader respects your privacy. No personal media data is collected.');
    });
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://instadownloader.app/terms').catch(() => {
      Alert.alert('Terms of Service', 'Insta Downloader is intended for personal media download use only.');
    });
  };

  const handleAbout = () => {
    Alert.alert(
      'About Insta Downloader',
      'Insta Downloader v1.0.0\n\nFast, simple and reliable Instagram Reels, Videos & Photos Downloader.'
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding + spacing.md }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            App preferences & details
          </Text>
        </View>

        {/* GENERAL SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>GENERAL</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* THEME */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="color-palette-outline" size={20} color={theme.primary} style={styles.icon} />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Theme</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>Light Theme</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* DOWNLOAD FOLDER */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="folder-outline" size={20} color={theme.primary} style={styles.icon} />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Download Folder</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                  {settings.downloadFolder}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* AUTO-SAVE TO GALLERY */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="images-outline" size={20} color={theme.primary} style={styles.icon} />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Auto-save to Gallery</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                  Automatically save media to device gallery
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoSaveToGallery}
              onValueChange={handleToggleAutoSave}
              trackColor={{ false: theme.cardSubtle, true: '#E1306C80' }}
              thumbColor={settings.autoSaveToGallery ? '#E1306C' : theme.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* NOTIFICATIONS */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="notifications-outline" size={20} color={theme.primary} style={styles.icon} />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
                <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>
                  Download completion alerts
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.cardSubtle, true: '#E1306C80' }}
              thumbColor={settings.notificationsEnabled ? '#E1306C' : theme.textMuted}
            />
          </View>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ABOUT</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* ABOUT APP */}
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="information-circle-outline" size={20} color={theme.primary} style={styles.icon} />
              <Text style={[styles.settingTitle, { color: theme.text }]}>About Insta Downloader</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* PRIVACY POLICY */}
          <TouchableOpacity style={styles.settingItem} onPress={handleOpenPrivacy}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} style={styles.icon} />
              <Text style={[styles.settingTitle, { color: theme.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* TERMS OF SERVICE */}
          <TouchableOpacity style={styles.settingItem} onPress={handleOpenTerms}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} style={styles.icon} />
              <Text style={[styles.settingTitle, { color: theme.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* APP VERSION */}
          <View style={styles.settingItem}>
            <View style={styles.settingLabelRow}>
              <Ionicons name="code-slash-outline" size={20} color={theme.primary} style={styles.icon} />
              <Text style={[styles.settingTitle, { color: theme.text }]}>App Version</Text>
            </View>
            <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>1.0.0</Text>
          </View>
        </View>

        {ADS_ENABLED ? (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={AD_UNIT_IDS.BANNER_SETTINGS}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.titleLarge,
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    paddingLeft: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  settingSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.md,
  },
  adContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
