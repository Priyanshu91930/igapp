import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_HISTORY_KEY = '@instadownloader/downloads_history';
const SETTINGS_KEY = '@instadownloader/settings';

export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'https://downloader-api-tau.vercel.app',
  themeMode: 'light', // 'light' | 'dark' | 'system'
  downloadFolder: 'InstaDownloader',
  autoSaveToGallery: true,
  notificationsEnabled: true,
};

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export async function getDownloadsHistory() {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addDownloadHistoryItem(item) {
  try {
    const current = await getDownloadsHistory();
    const newItem = {
      id: item.id || `download_${Date.now()}`,
      name: item.name || `Instagram_${item.type || 'Media'}_${Date.now()}`,
      title: item.title || 'Instagram Download',
      type: item.type || 'Reel', // 'Reel' | 'Video' | 'Photo'
      url: item.url || item.downloadUrl || '',
      originalUrl: item.originalUrl || '',
      fileUri: item.fileUri || '',
      thumbnail: item.thumbnail || '',
      sizeFormatted: item.sizeFormatted || item.size || 'Unknown',
      downloadedAt: item.downloadedAt || new Date().toISOString(),
    };

    // Filter duplicates by originalUrl or fileUri
    const filtered = current.filter(
      (h) => (newItem.originalUrl && h.originalUrl === newItem.originalUrl) ? false : (newItem.fileUri && h.fileUri === newItem.fileUri ? false : true)
    );

    const updated = [newItem, ...filtered];
    await AsyncStorage.setItem(DOWNLOADS_HISTORY_KEY, JSON.stringify(updated.slice(0, 200)));
    return updated;
  } catch (e) {
    console.error('Failed to add download history item:', e);
    return [];
  }
}

export async function removeDownloadHistoryItem(id) {
  try {
    const current = await getDownloadsHistory();
    const updated = current.filter((h) => h.id !== id);
    await AsyncStorage.setItem(DOWNLOADS_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export async function clearDownloadsHistory() {
  try {
    await AsyncStorage.removeItem(DOWNLOADS_HISTORY_KEY);
    return [];
  } catch (e) {
    return [];
  }
}
