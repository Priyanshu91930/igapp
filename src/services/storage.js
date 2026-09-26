import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser } from './authService';

const HISTORY_KEY = '@teraapp/history';
const SETTINGS_KEY = '@teraapp/settings';
const API_BASE_URL = 'https://teraapi-six.vercel.app';

export const DEFAULT_SETTINGS = {
  apiBaseUrl: 'https://teraapi-six.vercel.app',
  downloadQuality: 'auto',
  saveToGallery: false,
  autoResume: true,
};

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed.apiBaseUrl || parsed.apiBaseUrl.includes('-8bmpmowoj-')) {
      parsed.apiBaseUrl = DEFAULT_SETTINGS.apiBaseUrl;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, apiBaseUrl: DEFAULT_SETTINGS.apiBaseUrl }));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getHistory(userEmail) {
  let email = userEmail;
  if (!email) {
    const user = await getStoredUser();
    if (user && user.email) email = user.email;
  }

  // Always load local history from AsyncStorage first
  let localList = [];
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    localList = raw ? JSON.parse(raw) : [];
  } catch (e) {
    localList = [];
  }

  // If user is logged in, fetch cloud history from MongoDB and merge with local
  if (email) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch(`${API_BASE_URL}/api/history?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const rawText = await res.text();
        try {
          const data = JSON.parse(rawText);
          if (data && data.success && Array.isArray(data.history)) {
            const cloudList = data.history.map((c) => ({
              ...c,
              status: c.status || 'resolved',
              isCloudItem: true,
            }));

            const itemMap = new Map();

            // 1. Add cloud items
            cloudList.forEach((c) => {
              const key = c.url || c.name || c.id;
              if (key) itemMap.set(key, c);
            });

            // 2. Add local items (override or supplement cloud items with local state)
            localList.forEach((l) => {
              const key = l.url || l.name || l.id;
              if (key) {
                const existing = itemMap.get(key);
                itemMap.set(key, { ...existing, ...l });
              }
            });

            const merged = Array.from(itemMap.values());
            merged.sort((a, b) => new Date(b.downloadedAt || b.createdAt || 0) - new Date(a.downloadedAt || a.createdAt || 0));

            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(merged.slice(0, 100)));
            return merged;
          }
        } catch (jsonErr) {}
      }
    } catch (e) {
      console.log('MongoDB history fetch error, fallback to local:', e.message);
    }
  }

  return localList;
}

export async function addHistoryItem(item, userEmail) {
  let email = userEmail;
  if (!email) {
    const user = await getStoredUser();
    if (user && user.email) email = user.email;
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const newItem = {
    id: item.id || String(Date.now()),
    name: item.name || 'TeraBox File',
    size: item.size || 'Unknown',
    url: item.url || '',
    thumbnail: item.thumbnail || '',
    status: item.status || 'resolved',
    downloadedAt: item.downloadedAt || new Date().toISOString(),
    folderName: item.folderName || '',
  };

  // Read local storage history directly to prevent network overwrites during save
  let localList = [];
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    localList = raw ? JSON.parse(raw) : [];
  } catch (e) {
    localList = [];
  }

  // Deduplicate: remove existing items matching URL, name, or folder placeholder name
  const filtered = localList.filter((h) => {
    if (newItem.url && h.url === newItem.url) return false;
    if (newItem.folderName && h.name === newItem.folderName) return false;
    if (newItem.name === h.name) return false;
    return true;
  });

  const next = [newItem, ...filtered];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 100)));

  // Sync to MongoDB Cloud database in background asynchronously if logged in
  if (cleanEmail && newItem.url) {
    fetch(`${API_BASE_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: newItem.name,
        size: newItem.size,
        thumbnail: newItem.thumbnail,
        url: newItem.url,
      }),
    }).catch((e) => console.log('MongoDB history add error:', e.message));
  }

  return next;
}

export async function removeHistoryItem(id, userEmail) {
  let email = userEmail;
  if (!email) {
    const user = await getStoredUser();
    if (user && user.email) email = user.email;
  }

  if (email && id && !id.startsWith('disk_')) {
    const cleanEmail = email.trim().toLowerCase();
    fetch(`${API_BASE_URL}/api/history?email=${encodeURIComponent(cleanEmail)}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((e) => console.log('MongoDB history remove error:', e.message));
  }

  let localList = [];
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    localList = raw ? JSON.parse(raw) : [];
  } catch (e) {
    localList = [];
  }

  const next = localList.filter((h) => h.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearHistory(userEmail) {
  let email = userEmail;
  if (!email) {
    const user = await getStoredUser();
    if (user && user.email) email = user.email;
  }

  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    fetch(`${API_BASE_URL}/api/history?email=${encodeURIComponent(cleanEmail)}&clearAll=true`, {
      method: 'DELETE',
    }).catch((e) => console.log('MongoDB history clear error:', e.message));
  }

  await AsyncStorage.removeItem(HISTORY_KEY);
  return [];
}
