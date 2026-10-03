import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Project ID from google-services.json
const FIREBASE_PROJECT_ID = 'teraboxd0wnloader';

// Firestore REST API Endpoints
const FIRESTORE_COLLECTION_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/announcements`;
const FIRESTORE_LATEST_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/announcements/latest`;

const DISMISSED_KEY = 'dismissed_announcement_id';

/**
 * Helper to parse Firestore REST API response fields format
 */
function parseFirestoreFields(data) {
  if (!data || !data.fields) return null;

  const result = {};
  const fields = data.fields;
  for (const key in fields) {
    const fieldVal = fields[key];
    if (fieldVal.stringValue !== undefined) {
      result[key] = fieldVal.stringValue;
    } else if (fieldVal.booleanValue !== undefined) {
      result[key] = fieldVal.booleanValue;
    } else if (fieldVal.integerValue !== undefined) {
      result[key] = Number(fieldVal.integerValue);
    } else if (fieldVal.doubleValue !== undefined) {
      result[key] = Number(fieldVal.doubleValue);
    } else if (fieldVal.arrayValue !== undefined) {
      result[key] = (fieldVal.arrayValue.values || []).map(
        (v) => v.stringValue || v
      );
    }
  }
  return result;
}

/**
 * Fetch ALL active announcements from Firestore (for Settings -> Announcements Page)
 */
export async function fetchAllAnnouncements() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(FIRESTORE_COLLECTION_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const rawData = await response.json();
      const docs = rawData.documents || [];
      const list = [];

      for (const doc of docs) {
        const parsed = parseFirestoreFields(doc);
        if (parsed && parsed.active !== false && (parsed.title || parsed.text)) {
          // extract doc ID from name: projects/.../documents/announcements/latest
          const docId = doc.name ? doc.name.split('/').pop() : null;
          list.push(formatAnnouncement(parsed, docId));
        }
      }

      if (list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    // Silent catch
  }

  // Fallback if collection query fails: try fetching document 'latest'
  const single = await fetchLatestAnnouncement();
  return single ? [single] : [];
}

/**
 * Fetch strictly ONLY 1 latest active announcement for HomeScreen
 */
export async function fetchLatestAnnouncement() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(FIRESTORE_LATEST_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const rawData = await response.json();
      const parsedData = parseFirestoreFields(rawData);
      if (
        parsedData &&
        parsedData.active !== false &&
        (parsedData.title || parsedData.text)
      ) {
        return formatAnnouncement(parsedData, 'latest');
      }
    }
  } catch (err) {
    // Silent catch
  }

  return null;
}

function formatAnnouncement(data, docId) {
  return {
    id: docId || data.id || data.title || 'announcement_item',
    active: data.active !== false,
    badge: data.badge || '🔥 UPDATE',
    title: data.title || data.text || '',
    subtitle: data.subtitle || '',
    link: data.link || data.url || '',
    buttonText: data.buttonText || 'Open Link',
    date: data.date || data.createdAt || 'Recent',
    bgGradient: data.bgGradient || ['#FF5E36', '#FF9500'],
  };
}

/**
 * Check if an announcement has been dismissed by the user in this session
 */
export async function isAnnouncementDismissed(id) {
  try {
    const dismissedId = await AsyncStorage.getItem(DISMISSED_KEY);
    return dismissedId === String(id);
  } catch (e) {
    return false;
  }
}

/**
 * Mark an announcement as dismissed
 */
export async function dismissAnnouncement(id) {
  try {
    await AsyncStorage.setItem(DISMISSED_KEY, String(id));
  } catch (e) {
    // Silent catch
  }
}
