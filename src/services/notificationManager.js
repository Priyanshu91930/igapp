import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground or background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions (Android 13+ & iOS)
export async function requestNotificationPermission() {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }
  return true;
}

// Set up Android notification channels
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    // 1. Silent channel for live progress updates (no sound / vibrate on every % tick)
    await Notifications.setNotificationChannelAsync('download_progress_channel', {
      name: 'Download Progress',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
      showBadge: false,
    });

    // 2. High priority channel for download completed / failed alerts
    await Notifications.setNotificationChannelAsync('downloads_channel', {
      name: 'Download Completion Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      showBadge: true,
    });
  }
}

// Initialize notification services on app start
export async function initNotificationService() {
  try {
    await requestNotificationPermission();
    await setupNotificationChannel();
  } catch (e) {
    console.log('[NotificationService] Init error:', e.message);
  }
}

function channelTrigger(channelId = 'downloads_channel') {
  if (Platform.OS === 'android') {
    return { channelId };
  }
  return null;
}

// Show a download progress notification (Silent channel)
export async function showDownloadNotification(id, fileName, progress = 0) {
  const percent = Math.round(progress * 100);

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `download_${id}`,
      content: {
        title: `Downloading (${percent}%)`,
        body: fileName,
        color: '#E1306C',
        sticky: true,
        priority: 'low',
      },
      trigger: channelTrigger('download_progress_channel'),
    });
  } catch (e) {
    console.log('Notification error:', e.message);
  }
}

// Update download progress notification (Silent channel)
export async function updateDownloadNotification(
  id,
  fileName,
  progress,
  bytesWritten = '',
  totalBytes = '',
  speed = '',
  timeRemaining = ''
) {
  const percent = Math.round(progress * 100);
  const downloaded = [bytesWritten, totalBytes].filter(Boolean).join(' / ');
  const detail = [downloaded, speed, timeRemaining ? `${timeRemaining} left` : '']
    .filter(Boolean)
    .join(' · ');

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `download_${id}`,
      content: {
        title: `Downloading (${percent}%)`,
        body: `${fileName}${detail ? '\n' + detail : ''}`.trim(),
        color: '#E1306C',
        sticky: true,
        priority: 'low',
      },
      trigger: channelTrigger('download_progress_channel'),
    });
  } catch (e) {
    console.log('Notification update error:', e.message);
  }
}

// Show download complete notification (High priority channel)
export async function showDownloadCompleteNotification(id, fileName) {
  try {
    await Notifications.dismissNotificationAsync(`download_${id}`);
    await Notifications.scheduleNotificationAsync({
      identifier: `complete_${id}`,
      content: {
        title: 'Download Complete! 🎉',
        body: fileName,
        color: '#10B981',
        priority: 'high',
      },
      trigger: channelTrigger('downloads_channel'),
    });
  } catch (e) {
    console.log('Complete notification error:', e.message);
  }
}

// Show download failed notification
export async function showDownloadFailedNotification(id, fileName) {
  try {
    await Notifications.dismissNotificationAsync(`download_${id}`);
    await Notifications.scheduleNotificationAsync({
      identifier: `failed_${id}`,
      content: {
        title: 'Download Failed ❌',
        body: fileName,
        color: '#EF4444',
        priority: 'high',
      },
      trigger: channelTrigger('downloads_channel'),
    });
  } catch (e) {
    console.log('Failed notification error:', e.message);
  }
}

// Dismiss download notification
export async function dismissDownloadNotification(id) {
  try {
    await Notifications.dismissNotificationAsync(`download_${id}`);
  } catch (e) {
    console.log('Dismiss notification error:', e.message);
  }
}
