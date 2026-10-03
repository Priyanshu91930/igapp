import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { gradientColors, lightTheme, spacing, radius, typography } from '../theme';
import { validateInstagramUrl, resolveInstagramMedia } from '../services/InstagramDownloaderService';
import { downloadInstagramMedia, cancelDownload, shareFile } from '../services/downloadManager';
import { getSettings } from '../services/storage';
import { AD_UNIT_IDS, ADS_ENABLED } from '../services/adConfig';
import ShareSheet from '../components/ShareSheet';
import VideoPlayerModal from '../components/VideoPlayerModal';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);

  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvedMedia, setResolvedMedia] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showSupportedFormats, setShowSupportedFormats] = useState(false);

  // Downloading State & Image 2 Detailed Metrics
  const [downloading, setDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [downloadStats, setDownloadStats] = useState({
    percentage: 0,
    written: '0 B',
    total: 'Unknown',
    speed: '2.4 MB/s',
    timeRemaining: '0s',
  });
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const theme = lightTheme;

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInputUrl(text);
        setErrorMsg('');
      }
    } catch (e) {
      console.log('Clipboard read failed', e);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    setErrorMsg('');
    setResolvedMedia(null);
    setDownloadSuccess(null);
    setIsPaused(false);
  };

  const handleResolve = async () => {
    setErrorMsg('');
    setResolvedMedia(null);
    setDownloadSuccess(null);
    setIsPaused(false);

    const validation = validateInstagramUrl(inputUrl);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please enter a valid Instagram link.');
      return;
    }

    setLoading(true);
    try {
      const settings = await getSettings();
      const mediaInfo = await resolveInstagramMedia(settings.apiBaseUrl, validation.url);
      setResolvedMedia(mediaInfo);
    } catch (err) {
      setErrorMsg(err.message || 'This Instagram media could not be downloaded.');
    } finally {
      setLoading(false);
    }
  };

  const startDownloadProcess = async (mediaInfo) => {
    if (!mediaInfo) return;

    setDownloading(true);
    setIsPaused(false);
    setDownloadStats({
      percentage: 0,
      written: '0 B',
      total: mediaInfo.sizeFormatted || 'Unknown',
      speed: '2.4 MB/s',
      timeRemaining: 'Calculating...',
    });

    try {
      const downloadedItem = await downloadInstagramMedia(
        mediaInfo,
        (progressData) => {
          setDownloadStats({
            percentage: progressData.percentage || 0,
            written: progressData.written || '0 B',
            total: progressData.total || mediaInfo.sizeFormatted || 'Unknown',
            speed: progressData.speed || '2.4 MB/s',
            timeRemaining: progressData.timeRemaining || '0s',
          });
        }
      );

      setDownloadSuccess(downloadedItem);
      Alert.alert('Download Complete!', 'Instagram media has been saved to your downloads.');
    } catch (err) {
      if (err.message && !err.message.includes('canceled')) {
        Alert.alert('Download Failed', err.message || 'Could not save the media file.');
      }
    } finally {
      setDownloading(false);
      setIsPaused(false);
    }
  };

  const handleTogglePause = async () => {
    if (!resolvedMedia || !resolvedMedia.id) return;
    if (isPaused) {
      await resumeDownload(resolvedMedia.id);
      setIsPaused(false);
    } else {
      await pauseDownload(resolvedMedia.id);
      setIsPaused(true);
    }
  };

  const handleCancelDownload = async () => {
    if (resolvedMedia && resolvedMedia.id) {
      await cancelDownload(resolvedMedia.id);
    }
    setDownloading(false);
    setIsPaused(false);
  };

  const handleOpenDownloads = () => {
    if (downloadSuccess && downloadSuccess.fileUri) {
      setShowPlayerModal(true);
    } else if (navigation) {
      navigation.navigate('Downloads');
    }
  };

  const handleShareDownloaded = async () => {
    if (downloadSuccess && downloadSuccess.fileUri) {
      try {
        await shareFile(downloadSuccess.fileUri);
      } catch (e) {
        Alert.alert('Sharing Error', e.message);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* TOP HEADER BAR WITH SAFE AREA TOP PADDING */}
      <LinearGradient
        colors={gradientColors.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.topHeaderBar,
          {
            paddingTop: topPadding,
            height: 60 + topPadding,
          },
        ]}
      >
        <View style={styles.topHeaderContent}>
          <View style={styles.topHeaderLeftIcon}>
            <Image
              source={require('../../icon.png')}
              style={styles.topHeaderLogo}
              resizeMode="cover"
            />
          </View>

          <View style={styles.topHeaderTitleContainer} pointerEvents="none">
            <Text style={styles.topHeaderTitleCentered}>Insta Downloader</Text>
          </View>

          <TouchableOpacity
            style={styles.topHeaderShareButton}
            onPress={() => setShowShareModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* MAIN CARD MATCHING IMAGE 2 */}
        <View style={[styles.mainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* INPUT FIELD */}
          <View style={[styles.inputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="https://www.instagram.com/reel/1xxxxxxx"
              placeholderTextColor={theme.textMuted}
              value={inputUrl}
              onChangeText={(text) => {
                setInputUrl(text);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inputUrl.length > 0 ? (
              <TouchableOpacity onPress={handleClear} style={styles.clearIconButton}>
                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* HINT SUBTITLE PILL */}
          <View style={styles.hintPill}>
            <Ionicons name="bulb-outline" size={15} color="#833AB4" style={{ marginRight: 6 }} />
            <Text style={styles.hintText}>
              Paste any link above and tap Get Files to download instantly.
            </Text>
          </View>

          {/* ACTION BUTTONS ROW: [PASTE] [GET FILES] */}
          <View style={styles.actionButtonsRow}>
            {/* PASTE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePaste}
              style={styles.pasteButton}
            >
              <Ionicons name="clipboard-outline" size={18} color="#C13584" style={{ marginRight: 6 }} />
              <Text style={styles.pasteButtonText}>Paste</Text>
            </TouchableOpacity>

            {/* GET FILES BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleResolve}
              disabled={loading}
              style={styles.downloadButtonTouch}
            >
              <LinearGradient
                colors={gradientColors.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.downloadButtonText}>Get Files</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ERROR MESSAGE IF ANY */}
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
            </View>
          ) : null}
        </View>

        {/* SUPPORTED FORMATS CARD */}
        <View style={[styles.supportedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.supportedHeaderRow}
            onPress={() => setShowSupportedFormats(!showSupportedFormats)}
            activeOpacity={0.7}
          >
            <View style={styles.supportedHeaderTitleGroup}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} style={{ marginRight: 8 }} />
              <Text style={[styles.supportedTitle, { color: theme.text }]}>
                Supported Instagram Formats
              </Text>
            </View>
            <Ionicons
              name={showSupportedFormats ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {showSupportedFormats ? (
            <View style={styles.supportedItemsList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={18} color={theme.success} style={styles.checkIcon} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>Instagram Reels</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={18} color={theme.success} style={styles.checkIcon} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>Instagram Videos</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={18} color={theme.success} style={styles.checkIcon} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>Instagram Photos</Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={18} color={theme.success} style={styles.checkIcon} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>Instagram Stories & Carousel</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* LOADING STATE CARD */}
        {loading ? (
          <View style={[styles.mainCard, styles.loadingCard, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color="#E1306C" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Resolving Instagram media...
            </Text>
          </View>
        ) : null}

        {/* DOWNLOAD RESULT PREVIEW CARD (MATCHING IMAGE 2 EXACTLY) */}
        {resolvedMedia && !loading ? (
          <View style={[styles.resultCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
            {/* TOP ROW: THUMBNAIL ON LEFT, TITLE & BADGE ON RIGHT */}
            <View style={styles.compactHeaderRow}>
              {resolvedMedia.thumbnail ? (
                <Image
                  source={{ uri: resolvedMedia.thumbnail }}
                  style={styles.compactThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.compactThumbnailPlaceholder, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="logo-instagram" size={24} color={theme.textMuted} />
                </View>
              )}

              <View style={styles.compactMetaContainer}>
                <Text style={styles.compactTitle} numberOfLines={1}>
                  {resolvedMedia.title || `Instagram ${resolvedMedia.type}`}
                </Text>

                <View style={styles.compactStatusRow}>
                  <View
                    style={[
                      styles.compactStatusBadge,
                      {
                        backgroundColor: downloading
                          ? '#EEF2FF'
                          : downloadSuccess
                          ? '#ECFDF5'
                          : '#FDF2F8',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        downloading
                          ? isPaused
                            ? 'pause-circle-outline'
                            : 'cloud-download-outline'
                          : downloadSuccess
                          ? 'checkmark-circle-outline'
                          : 'cloud-outline'
                      }
                      size={13}
                      color={downloading ? '#3B82F6' : downloadSuccess ? '#10B981' : '#E1306C'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.compactStatusText,
                        {
                          color: downloading ? '#3B82F6' : downloadSuccess ? '#10B981' : '#E1306C',
                        },
                      ]}
                    >
                      {downloading ? (isPaused ? 'Paused' : 'Downloading') : downloadSuccess ? 'Downloaded' : 'Ready'}
                    </Text>
                  </View>
                  <Text style={styles.compactSizeText}>
                    {downloadStats.total && downloadStats.total !== 'Unknown'
                      ? downloadStats.total
                      : resolvedMedia.sizeFormatted || 'Media'}
                  </Text>
                </View>
              </View>
            </View>

            {/* DOWNLOADING STATE METRICS & PROGRESS BAR (IMAGE 2 MATCH) */}
            {downloading ? (
              <View style={styles.downloadingSection}>
                {/* METRICS PILLS (SPEED & REMAINING TIME) */}
                <View style={styles.metricsPillsRow}>
                  <View style={styles.metricPill}>
                    <Ionicons name="speedometer-outline" size={13} color="#3B82F6" style={{ marginRight: 4 }} />
                    <Text style={styles.metricPillText}>{downloadStats.speed}</Text>
                  </View>
                  <View style={styles.metricPill}>
                    <Ionicons name="time-outline" size={13} color="#3B82F6" style={{ marginRight: 4 }} />
                    <Text style={styles.metricPillText}>{downloadStats.timeRemaining}</Text>
                  </View>
                </View>

                {/* WRITTEN/TOTAL & PERCENTAGE */}
                <View style={styles.progressMetricsRow}>
                  <Text style={styles.writtenTotalText}>
                    {downloadStats.written} / {downloadStats.total}
                  </Text>
                  <Text style={styles.percentageText}>
                    {downloadStats.percentage}%
                  </Text>
                </View>

                {/* PROGRESS BAR TRACK & DOT INDICATOR */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.max(4, downloadStats.percentage)}%` }]}>
                    <View style={styles.progressBarDot} />
                  </View>
                </View>

                {/* PAUSE & CANCEL ACTION BUTTONS */}
                <View style={styles.downloadingButtonsRow}>
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={handleTogglePause}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPaused ? 'play-outline' : 'pause-outline'}
                      size={15}
                      color="#3B82F6"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.pauseButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelDownload}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : downloadSuccess ? (
              /* DOWNLOAD SUCCESS ACTIONS */
              <View style={styles.successActionsContainer}>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: '#F1F5F9' }]}
                    onPress={handleOpenDownloads}
                  >
                    <Ionicons name="folder-open-outline" size={16} color="#1E293B" />
                    <Text style={[styles.secondaryButtonText, { color: '#1E293B' }]}>Open File</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: '#FDF2F8' }]}
                    onPress={handleShareDownloaded}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#E1306C" />
                    <Text style={[styles.secondaryButtonText, { color: '#E1306C' }]}>Share</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: '#E2E8F0' }]}
                  onPress={() => startDownloadProcess(resolvedMedia)}
                >
                  <Text style={[styles.outlineButtonText, { color: '#64748B' }]}>Download Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* READY TO DOWNLOAD BUTTON */
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => startDownloadProcess(resolvedMedia)}
                style={styles.saveMediaButtonTouch}
              >
                <LinearGradient
                  colors={gradientColors.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.downloadButtonGradient}
                >
                  <Ionicons name="cloud-download-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadButtonText}>Start Download</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* SHARE SHEET MODAL */}
      <ShareSheet
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* FULLSCREEN VIDEO PLAYER MODAL */}
      <VideoPlayerModal
        visible={showPlayerModal}
        item={downloadSuccess}
        onClose={() => setShowPlayerModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderBar: {
    paddingHorizontal: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  topHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    position: 'relative',
    width: '100%',
  },
  topHeaderLeftIcon: {
    width: 40,
    justifyContent: 'center',
    zIndex: 2,
  },
  topHeaderLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
  },
  topHeaderTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitleCentered: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  topHeaderShareButton: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 4,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 80,
  },
  mainCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: 14,
    width: '100%',
  },
  clearIconButton: {
    position: 'absolute',
    right: 12,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  hintText: {
    fontSize: 12,
    color: '#833AB4',
    fontWeight: '500',
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pasteButton: {
    width: '32%',
    height: 48,
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteButtonText: {
    color: '#C13584',
    fontSize: 15,
    fontWeight: '700',
  },
  downloadButtonTouch: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  downloadButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  saveMediaButtonTouch: {
    marginTop: spacing.md,
    height: 50,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: '#FEF2F2',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: {
    ...typography.bodySmall,
    marginLeft: spacing.xs,
    flex: 1,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.bodyMedium,
    marginTop: spacing.md,
  },
  resultCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  compactThumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactMetaContainer: {
    flex: 1,
    marginLeft: 14,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  compactStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactSizeText: {
    fontSize: 12,
  },
  downloadingSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricsPillsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  metricPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  progressMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  writtenTotalText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarDot: {
    position: 'absolute',
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  downloadingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pauseButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  successActionsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  outlineButton: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  supportedCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  supportedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  supportedHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportedTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  supportedItemsList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: 4,
  },
  checkIcon: {
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
