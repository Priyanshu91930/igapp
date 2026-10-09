/**
 * InstagramDownloaderService.js
 *
 * Dedicated service layer for Instagram & Threads URL validation, media resolution,
 * and error handling for Insta & Threads Downloader app.
 */

// Strict pattern for Instagram URLs
const INSTAGRAM_URL_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv|stories|share)\/([A-Za-z0-9_-]+)/i;

// Strict pattern for Threads URLs
const THREADS_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:threads\.net|threads\.com)\/(?:@[\w.-]+\/post\/|share\/|t\/)([A-Za-z0-9_-]+)/i;

// Other platform domain signatures to detect non-Instagram/Threads links explicitly
const OTHER_PLATFORMS_REGEX = /(youtube\.com|youtu\.be|tiktok\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|pinterest\.com|pin\.it|spotify\.com|soundcloud\.com|mediafire\.com|drive\.google\.com|capcut\.com|douyin\.com|kuaishou\.com|snackvideo\.com)/i;

function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Validates whether the given text contains a valid Instagram or Threads post/reel/photo/video link.
 * Rejects other platform links explicitly.
 * 
 * @param {string} input - User input string
 * @returns {{ valid: boolean, url?: string, isThreads?: boolean, error?: string }}
 */
export function validateInstagramUrl(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Please enter a valid Instagram or Threads link.' };
  }

  const trimmed = input.trim();

  // Explicit check for non-Instagram/Threads media platforms
  if (OTHER_PLATFORMS_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Only Instagram and Threads links are supported.',
    };
  }

  const isIg = trimmed.match(INSTAGRAM_URL_REGEX);
  const isThreads = trimmed.match(THREADS_URL_REGEX) || /(?:threads\.net|threads\.com)/i.test(trimmed);

  if (!isIg && !isThreads) {
    return {
      valid: false,
      error: 'Please enter a valid Instagram (Reel, Video, Photo, Story) or Threads link.',
    };
  }

  let url = isIg ? isIg[0] : (trimmed.match(/https?:\/\/\S+/i)?.[0] || trimmed);
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return { valid: true, url, isThreads: !!isThreads };
}

/**
 * Resolves an Instagram or Threads URL into downloadable media metadata.
 * 
 * @param {string} baseUrl - API server base URL
 * @param {string} inputUrl - Validated Instagram or Threads link
 * @returns {Promise<Object>} Media details object { id, type, title, thumbnail, mediaItems, sizeFormatted }
 */
export async function resolveInstagramMedia(baseUrl, inputUrl) {
  const validation = validateInstagramUrl(inputUrl);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.code = 'INVALID_URL';
    throw error;
  }

  const validUrl = validation.url;
  const isThreads = validation.isThreads || /threads\.(com|net)/i.test(validUrl);
  const cleanBaseUrl = (baseUrl || 'https://alldownloader.solankipriyanshu94.workers.dev').replace(/\/+$/, '');
  
  const platformName = isThreads ? 'threads' : 'instagram';
  const cleanUrl = validUrl.split('?')[0];

  const primaryEndpoint = `${cleanBaseUrl}/api/download/${platformName}?url=${encodeURIComponent(cleanUrl)}`;
  const rawEndpoint = `${cleanBaseUrl}/api/download/${platformName}?url=${encodeURIComponent(validUrl)}`;
  const fallbackEndpoint = isThreads
    ? `${cleanBaseUrl}/api/download/threads?url=${encodeURIComponent(cleanUrl)}`
    : `${cleanBaseUrl}/api/download/instagram?url=${encodeURIComponent(cleanUrl)}`;

  let response;
  const fetchWithTimeout = async (endpoint, timeoutMs = 8500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'InstaDownloaderApp/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res && res.ok) return res;
      throw new Error(`HTTP ${res ? res.status : 500}`);
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };

  try {
    // Stage 1: Clean URL attempt (Vercel Budget #1: 8.5s)
    response = await fetchWithTimeout(primaryEndpoint, 8500).catch(async () => {
      // Stage 2: Raw URL attempt with fresh Vercel Budget #2 (8.5s)
      return await fetchWithTimeout(rawEndpoint, 8500).catch(async () => {
        // Stage 3: Fallback endpoint with fresh Vercel Budget #3 (8.5s)
        return await fetchWithTimeout(fallbackEndpoint, 8500).catch(() => null);
      });
    });
  } catch (err) {
    const error = new Error('Unable to connect. Please check your internet connection.');
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  if (!response || !response.ok) {
    if (response && response.status === 404) {
      const error = new Error(`This ${isThreads ? 'Threads' : 'Instagram'} media could not be downloaded.`);
      error.code = 'MEDIA_UNAVAILABLE';
      throw error;
    }
    if (response && (response.status === 401 || response.status === 403)) {
      const error = new Error('This content cannot be accessed.');
      error.code = 'PRIVATE_CONTENT';
      throw error;
    }
    let errorMsg = `This ${isThreads ? 'Threads' : 'Instagram'} media could not be downloaded.`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) {
        if (/private|login|account/i.test(errJson.message)) {
          errorMsg = 'This content cannot be accessed.';
        } else if (/not found|unavailable|removed/i.test(errJson.message)) {
          errorMsg = `This ${isThreads ? 'Threads' : 'Instagram'} media could not be downloaded.`;
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
    const error = new Error(`This ${isThreads ? 'Threads' : 'Instagram'} media could not be downloaded.`);
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
  const isThreads = /threads\.(com|net)/i.test(originalUrl);

  let rawCaption =
    norm.title ||
    norm.caption ||
    data.caption ||
    data.title ||
    data.text ||
    data.description ||
    (data.result && (data.result.title || data.result.caption)) ||
    (data.result && data.result[0] && (data.result[0].caption || data.result[0].title)) ||
    '';

  const shortcodeMatch = String(originalUrl || '').match(/(?:p|reel|reels|tv|stories|share|post)\/([A-Za-z0-9_-]+)/i);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

  let title = rawCaption ? decodeHtmlEntities(String(rawCaption).trim()) : '';
  let thumbnail = norm.thumbnail || data.thumbnail || data.cover || (data.result && data.result.thumbnail) || '';
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
  } else if (data.url || data.download_url || data.video_url || (data.result && (data.result.video || data.result.download))) {
    const mediaUrl = data.url || data.download_url || data.video_url || (data.result && (data.result.video || data.result.download));
    mediaList = [{
      id: 'media_0',
      url: mediaUrl,
      type: mediaUrl.match(/\.(jpg|jpeg|png|webp)/i) ? 'photo' : 'video',
      label: 'Video',
    }];
  }

  if (mediaList.length === 0) {
    const error = new Error(`This ${isThreads ? 'Threads' : 'Instagram'} media could not be downloaded.`);
    error.code = 'NO_MEDIA_FOUND';
    throw error;
  }

  let detectedType = isThreads ? 'Threads Video' : 'Reel';
  if (!isThreads) {
    if (originalUrl.includes('/p/')) {
      detectedType = mediaList[0].type === 'photo' ? 'Photo' : 'Video';
    } else if (originalUrl.includes('/tv/')) {
      detectedType = 'Video';
    } else if (originalUrl.includes('/stories/')) {
      detectedType = 'Story';
    } else if (mediaList[0].type === 'photo') {
      detectedType = 'Photo';
    }
  }

  const primaryDownloadUrl = mediaList[0].url;

  return {
    id: `media_${Date.now()}`,
    originalUrl,
    type: detectedType,
    title: title || (isThreads ? `Threads Video` : (shortcode ? `Instagram ${detectedType} (${shortcode})` : `Instagram ${detectedType}`)),
    thumbnail: thumbnail || primaryDownloadUrl,
    downloadUrl: primaryDownloadUrl,
    mediaItems: mediaList,
    sizeFormatted: data.size || 'HD Quality',
    createdAt: new Date().toISOString(),
  };
}
