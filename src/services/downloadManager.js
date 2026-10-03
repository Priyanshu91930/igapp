import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { addDownloadHistoryItem, getDownloadsHistory, removeDownloadHistoryItem } from './storage';
import {
  showDownloadNotification,
  updateDownloadNotification,
  showDownloadCompleteNotification,
  showDownloadFailedNotification,
  dismissDownloadNotification,
} from './notificationManager';

// In-memory active downloads map
const activeResumableDownloads = {};

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (isNaN(i) || i < 0) return '0 B';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Clean file name string for storage saving
 */
function sanitizeFileName(name, extension = 'mp4') {
  const clean = (name || 'instagram_media')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40);
  return `${clean}_${Date.now()}.${extension}`;
}

/**
 * Starts downloading Instagram media using Expo FileSystem
 */
export async function downloadInstagramMedia(item, onProgress) {
  if (!item || (!item.downloadUrl && !item.url)) {
    throw new Error('No valid download URL provided.');
  }

  const downloadUrl = item.downloadUrl || item.url;
  const isPhoto = item.type === 'Photo' || downloadUrl.match(/\.(jpg|jpeg|png|webp)/i);
  const ext = isPhoto ? 'jpg' : 'mp4';
  const fileName = sanitizeFileName(item.title || item.name, ext);
  const displayTitle = item.title || fileName;

  const fileDir = `${FileSystem.documentDirectory}InstaDownloader/`;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(fileDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(fileDir, { intermediates: true });
    }
  } catch (e) {
    console.log('[DownloadManager] Directory check:', e.message);
  }

  const fileUri = `${fileDir}${fileName}`;
  const downloadId = item.id || `ig_${Date.now()}`;

  let lastNotificationTime = 0;

  const callback = (downloadProgress) => {
    const totalBytes = downloadProgress.totalBytesWritten;
    const expectedBytes = downloadProgress.totalBytesExpectedToWrite;
    const progress = expectedBytes > 0 ? totalBytes / expectedBytes : 0.5;

    const now = Date.now();
    const timeDiff = (now - lastTime) / 1000;

    if (timeDiff >= 0.4) {
      const bytesDiff = totalBytes - lastWritten;
      const speed = bytesDiff / timeDiff;
      if (speed > 0) {
        currentSpeed = `${formatBytes(speed)}/s`;
        if (expectedBytes > totalBytes) {
          const remSecs = (expectedBytes - totalBytes) / speed;
          if (remSecs < 60) currentTimeRem = `${Math.round(remSecs)}s`;
          else currentTimeRem = `${Math.floor(remSecs / 60)}m ${Math.round(remSecs % 60)}s`;
        }
      }
      lastTime = now;
      lastWritten = totalBytes;
    }

    const progressData = {
      downloadId,
      progress,
      written: formatBytes(totalBytes),
      total: expectedBytes > 0 ? formatBytes(expectedBytes) : 'Unknown',
      percentage: Math.round(progress * 100),
      speed: currentSpeed,
      timeRemaining: currentTimeRem,
    };

    if (onProgress) {
      onProgress(progressData);
    }

    // Update status bar notification silently every 1.5 seconds
    if (now - lastNotificationTime >= 1500) {
      lastNotificationTime = now;
      updateDownloadNotification(
        downloadId,
        displayTitle,
        progress,
        formatBytes(totalBytes),
        expectedBytes > 0 ? formatBytes(expectedBytes) : '',
        currentSpeed,
        currentTimeRem
      );
    }
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  let downloadResult;

  // Show silent progress notification at start
  showDownloadNotification(downloadId, displayTitle, 0);

  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      fileUri,
      { headers },
      callback
    );

    activeResumableDownloads[downloadId] = downloadResumable;
    downloadResult = await downloadResumable.downloadAsync();
    delete activeResumableDownloads[downloadId];
  } catch (resumableErr) {
    delete activeResumableDownloads[downloadId];
    try {
      downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri, { headers });
    } catch (err) {
      showDownloadFailedNotification(downloadId, displayTitle);
      throw err;
    }
  }

  if (!downloadResult || !downloadResult.uri) {
    showDownloadFailedNotification(downloadId, displayTitle);
    throw new Error('Download failed: file empty or saved location invalid.');
  }

  let sizeFormatted = 'HD Media';
  try {
    const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
    if (fileInfo.size) {
      sizeFormatted = formatBytes(fileInfo.size);
    }
  } catch (e) {}

  const historyItem = {
    id: downloadId,
    name: fileName,
    title: item.title || 'Instagram Media',
    type: item.type || (isPhoto ? 'Photo' : 'Reel'),
    url: downloadUrl,
    originalUrl: item.originalUrl || downloadUrl,
    fileUri: downloadResult.uri,
    thumbnail: item.thumbnail || downloadResult.uri,
    sizeFormatted: sizeFormatted || item.sizeFormatted || 'Saved',
    downloadedAt: new Date().toISOString(),
  };

  await addDownloadHistoryItem(historyItem);

  // Show complete notification
  showDownloadCompleteNotification(downloadId, displayTitle);

  return historyItem;
}

/**
 * Cancel an active download by ID
 */
export async function cancelDownload(downloadId) {
  if (activeResumableDownloads[downloadId]) {
    try {
      await activeResumableDownloads[downloadId].cancelAsync();
    } catch (e) {}
    delete activeResumableDownloads[downloadId];
  }
  dismissDownloadNotification(downloadId);
}

/**
 * Pause an active download by ID
 */
export async function pauseDownload(downloadId) {
  if (activeResumableDownloads[downloadId]) {
    try {
      await activeResumableDownloads[downloadId].pauseAsync();
      dismissDownloadNotification(downloadId);
      return true;
    } catch (e) {
      console.log('Pause error:', e.message);
    }
  }
  return false;
}

/**
 * Resume a paused download by ID
 */
export async function resumeDownload(downloadId) {
  if (activeResumableDownloads[downloadId]) {
    try {
      await activeResumableDownloads[downloadId].resumeAsync();
      return true;
    } catch (e) {
      console.log('Resume error:', e.message);
    }
  }
  return false;
}

/**
 * Share downloaded file
 */
export async function shareFile(fileUri) {
  if (!fileUri) return;
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this device.');
  }
  await Sharing.shareAsync(fileUri);
}

/**
 * Get list of downloaded media files
 */
export async function getDownloadedItems() {
  return await getDownloadsHistory();
}

/**
 * Delete downloaded file and remove from history
 */
export async function deleteDownloadedItem(id, fileUri) {
  if (fileUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (e) {
      console.warn('Failed to delete physical file:', e.message);
    }
  }
  return await removeDownloadHistoryItem(id);
}
