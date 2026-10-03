/**
 * api.js
 * Unified API wrapper for Insta Downloader app
 */

import { validateInstagramUrl, resolveInstagramMedia } from './InstagramDownloaderService';

export { validateInstagramUrl, resolveInstagramMedia };

export async function checkServerHealth(baseUrl) {
  try {
    if (!baseUrl) return false;
    const endpoint = baseUrl.replace(/\/+$/, '');
    const res = await fetch(`${endpoint}/health`, { method: 'GET' });
    return res.ok;
  } catch (e) {
    return false;
  }
}
