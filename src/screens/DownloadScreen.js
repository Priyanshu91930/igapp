import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { lightTheme, spacing, radius, typography } from '../theme';
import { getDownloadedItems, deleteDownloadedItem, shareFile } from '../services/downloadManager';
import { AD_UNIT_IDS, ADS_ENABLED } from '../services/adConfig';
import VideoPlayerModal from '../components/VideoPlayerModal';

export default function DownloadScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);

  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  const theme = lightTheme;

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const items = await getDownloadedItems();
      setDownloads(items || []);
    } catch (e) {
      console.error('Error loading downloads:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [])
  );

  const handleOpenItem = (item) => {
    if (!item || !item.fileUri) return;
    setSelectedItem(item);
    setShowPlayerModal(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete "${item.title || item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteDownloadedItem(item.id, item.fileUri);
            setDownloads(updated || []);
          },
        },
      ]
    );
  };

  const handleShare = async (item) => {
    if (!item.fileUri) return;
    try {
      await shareFile(item.fileUri);
    } catch (e) {
      Alert.alert('Sharing Error', e.message);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderItem = ({ item }) => {
    const isPhoto = item.type === 'Photo' || (item.fileUri && item.fileUri.match(/\.(jpg|jpeg|png|webp)$/i));

    return (
      <View style={[styles.downloadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* CLICKABLE CARD HEADER */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => handleOpenItem(item)}
          activeOpacity={0.7}
        >
          {/* THUMBNAIL WITH PLAY OVERLAY */}
          <View style={styles.thumbnailWrapper}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.cardSubtle }]}>
                <Ionicons name="logo-instagram" size={24} color={theme.textMuted} />
              </View>
            )}

            {!isPhoto ? (
              <View style={styles.playIconBadge}>
                <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
            ) : null}
          </View>

          <View style={styles.metaContainer}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {item.title || item.name}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type || 'Media'}</Text>
              </View>
              <Text style={[styles.sizeText, { color: theme.textMuted }]}>{item.sizeFormatted || 'Saved'}</Text>
            </View>

            <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(item.downloadedAt)}</Text>
          </View>
        </TouchableOpacity>

        {/* ACTION BUTTONS: PLAY, SHARE, DELETE */}
        <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, styles.playActionButton]}
            onPress={() => handleOpenItem(item)}
            activeOpacity={0.8}
          >
            <Ionicons name={isPhoto ? 'eye-outline' : 'play-circle-outline'} size={16} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
              {isPhoto ? 'View' : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.cardSubtle }]}
            onPress={() => handleShare(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={16} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: topPadding + spacing.md }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Downloads</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Your downloaded Instagram media files
        </Text>
      </View>

      {downloads.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: '#E1306C15' }]}>
            <Ionicons name="cloud-download-outline" size={48} color="#E1306C" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No downloads yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Your downloaded Instagram media will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {ADS_ENABLED ? (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER_DOWNLOADS}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      ) : null}

      {/* FULLSCREEN VIDEO PLAYER MODAL */}
      <VideoPlayerModal
        visible={showPlayerModal}
        item={selectedItem}
        onClose={() => setShowPlayerModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.titleLarge,
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  downloadCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  metaContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    backgroundColor: '#E1306C',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sizeText: {
    ...typography.caption,
  },
  dateText: {
    ...typography.caption,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  playActionButton: {
    backgroundColor: '#E1306C',
  },
  deleteButton: {
    backgroundColor: '#EF444415',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.titleMedium,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
