import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchLatestAnnouncement,
  isAnnouncementDismissed,
  dismissAnnouncement,
} from '../services/announcementService';

export default function UpdateBannerTicker({ onSelectLink, isFocused }) {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const data = await fetchLatestAnnouncement();
      if (!isMounted) return;

      if (data && data.active) {
        const isDismissed = await isAnnouncementDismissed(data.id);
        if (!isDismissed) {
          setAnnouncement(data);
          setDismissed(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        } else {
          setAnnouncement(null);
        }
      } else {
        setAnnouncement(null);
      }
    }

    if (isFocused || isFocused === undefined) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  if (!announcement || dismissed) {
    return null;
  }

  const handlePress = async () => {
    if (!announcement.link) return;

    if (onSelectLink) {
      // Pass link to HomeScreen to paste into input & handle
      onSelectLink(announcement.link);
    } else {
      // Default: open link in browser
      try {
        const supported = await Linking.canOpenURL(announcement.link);
        if (supported) {
          await Linking.openURL(announcement.link);
        }
      } catch (err) {
        console.log('[UpdateBannerTicker] Failed to open link:', err.message);
      }
    }
  };

  const handleDismiss = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      setDismissed(true);
      if (announcement?.id) {
        await dismissAnnouncement(announcement.id);
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={announcement.bgGradient || ['#FF5E36', '#FF9500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Left Icon / Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{announcement.badge || '🔥 UPDATE'}</Text>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText} numberOfLines={2} ellipsizeMode="tail">
              {announcement.title}
            </Text>
            {!!announcement.subtitle && (
              <Text style={styles.subtitleText} numberOfLines={1}>
                {announcement.subtitle}
              </Text>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {announcement.buttonText || 'Open'}
            </Text>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 1 }} />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 6,
    marginVertical: 4,
  },
  touchable: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#FF5E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  closeButton: {
    padding: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 10,
  },
});
