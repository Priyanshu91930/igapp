/**
 * InstagramDownloaderService.js
 *
 * Dedicated service layer strictly for Instagram URL validation, media resolution,
 * and error handling for Insta Downloader app.
 */

// Strict pattern for Instagram URLs
const INSTAGRAM_URL_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories|share)\/([A-Za-z0-9_-]+)/i;

// Other platform domain signatures to detect non-Instagram links explicitly
const OTHER_PLATFORMS_REGEX = /(youtube\.com|youtu\.be|tiktok\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|pinterest\.com|pin\.it|spotify\.com|soundcloud\.com|mediafire\.com|drive\.google\.com|capcut\.com|douyin\.com|kuaishou\.com|threads\.net|snackvideo\.com)/i;

/**
 * Validates whether the given text contains a valid Instagram post/reel/photo/video link.
 * Rejects non-Instagram platform links explicitly.
 * 
 * @param {string} input - User input string
 * @returns {{ valid: boolean, url?: string, error?: string }}
 */
export function validateInstagramUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Please enter a valid Instagram link.' };
  }

  const trimmed = input.trim();

  // Explicit check for non-Instagram media platforms
  if (OTHER_PLATFORMS_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Only Instagram links are supported. Non-Instagram links (YouTube, TikTok, Facebook, etc.) are disabled.',
    };
  }

  const match = trimmed.match(INSTAGRAM_URL_REGEX);
  if (!match) {
    return {
      valid: false,
      error: 'Please enter a valid Instagram link (Reel, Video, Photo, or Story).',
    };
  }

  let url = match[0];
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return { valid: true, url };
}

/**
 * Resolves an Instagram URL into downloadable media metadata.
 * 
 * @param {string} baseUrl - API server base URL
 * @param {string} instagramUrl - Validated Instagram link
 * @returns {Promise<Object>} Media details object { id, type, title, thumbnail, mediaItems, sizeFormatted }
 */
export async function resolveInstagramMedia(baseUrl, instagramUrl) {
  const validation = validateInstagramUrl(instagramUrl);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.code = 'INVALID_URL';
    throw error;
  }

  const validUrl = validation.url;
  const cleanBaseUrl = (baseUrl || 'https://downloader-api-tau.vercel.app').replace(/\/+$/, '');
  
  // STRICTLY target ONLY Instagram endpoint: /api/download/instagram?url=...
  const targetEndpoint = `${cleanBaseUrl}/api/download/instagram?url=${encodeURIComponent(validUrl)}`;
  const fallbackEndpoint = `${cleanBaseUrl}/api/instagram?url=${encodeURIComponent(validUrl)}`;

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    response = await fetch(targetEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InstaDownloaderApp/1.0',
      },
      signal: controller.signal,
    }).catch(async () => {
      // Fallback only to specific Instagram endpoint
      return await fetch(fallbackEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
    });

    clearTimeout(timeoutId);
  } catch (err) {
    const error = new Error('Unable to connect. Please check your internet connection.');
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  if (!response || !response.ok) {
    if (response && response.status === 404) {
      const error = new Error('This Instagram media could not be downloaded.');
      error.code = 'MEDIA_UNAVAILABLE';
      throw error;
    }
    if (response && (response.status === 401 || response.status === 403)) {
      const error = new Error('This content cannot be accessed.');
      error.code = 'PRIVATE_CONTENT';
      throw error;
    }
    let errorMsg = 'This Instagram media could not be downloaded.';
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) {
        if (/private|login|account/i.test(errJson.message)) {
          errorMsg = 'This content cannot be accessed.';
        } else if (/not found|unavailable|removed/i.test(errJson.message)) {
          errorMsg = 'This Instagram media could not be downloaded.';
        }
      }
    } catch (_) {}
    const error = new Error(errorMsg);
    error.code = 'API_ERROR';
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    const error = new Error('This Instagram media could not be downloaded.');
    error.code = 'PARSE_ERROR';
    throw error;
  }

  return parseInstagramApiResponse(data, validUrl);
}

/**
 * Normalizes API response formats into consistent structure.
 */
function parseInstagramApiResponse(data, originalUrl) {
  const norm = data.normalized || data;

  let rawCaption =
    norm.title ||
    norm.caption ||
    data.caption ||
    data.title ||
    data.text ||
    data.description ||
    (data.result && data.result[0] && (data.result[0].caption || data.result[0].title)) ||
    '';

  const shortcodeMatch = String(originalUrl || '').match(/(?:p|reel|reels|tv|stories|share)\/([A-Za-z0-9_-]+)/i);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

  let title = rawCaption ? String(rawCaption).trim() : '';
  let thumbnail = norm.thumbnail || data.thumbnail || data.cover || '';
  let mediaList = [];

  if (norm.kind === 'media' && Array.isArray(norm.media)) {
    mediaList = norm.media.map((item, index) => ({
      id: `media_${index}`,
      url: item.url,
      type: item.type === 'image' ? 'photo' : 'video',
      label: item.label || (item.type === 'image' ? `Photo ${index + 1}` : `Video ${index + 1}`),
    }));
  } else if (Array.isArray(data.result)) {
    mediaList = data.result.map((item, index) => ({
      id: `media_${index}`,
      url: item.url || item.download_url || item,
      type: (item.url || item).match(/\.(jpg|jpeg|png|webp)/i) ? 'photo' : 'video',
      label: `Media ${index + 1}`,
    }));
    if (!thumbnail && data.result[0] && data.result[0].thumbnail) {
      thumbnail = data.result[0].thumbnail;
    }
  } else if (data.url || data.download_url || data.video_url) {
    const mediaUrl = data.url || data.download_url || data.video_url;
    mediaList = [{
      id: 'media_0',
      url: mediaUrl,
      type: mediaUrl.match(/\.(jpg|jpeg|png|webp)/i) ? 'photo' : 'video',
      label: 'Media',
    }];
  }

  if (mediaList.length === 0) {
    const error = new Error('This Instagram media could not be downloaded.');
    error.code = 'NO_MEDIA_FOUND';
    throw error;
  }

  let detectedType = 'Reel';
  if (originalUrl.includes('/p/')) {
    detectedType = mediaList[0].type === 'photo' ? 'Photo' : 'Video';
  } else if (originalUrl.includes('/tv/')) {
    detectedType = 'Video';
  } else if (originalUrl.includes('/stories/')) {
    detectedType = 'Story';
  } else if (mediaList[0].type === 'photo') {
    detectedType = 'Photo';
  }

  const primaryDownloadUrl = mediaList[0].url;

  return {
    id: `ig_${Date.now()}`,
    originalUrl,
    type: detectedType,
    title: title || (shortcode ? `Instagram ${detectedType} (${shortcode})` : `Instagram ${detectedType}`),
    thumbnail: thumbnail || primaryDownloadUrl,
    downloadUrl: primaryDownloadUrl,
    mediaItems: mediaList,
    sizeFormatted: data.size || 'HD Quality',
    createdAt: new Date().toISOString(),
  };
}
