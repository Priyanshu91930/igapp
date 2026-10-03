import { TestIds } from 'react-native-google-mobile-ads';

// AdMob Configuration for Insta Downloader (Strictly 4 requested Ad units)
export const USE_PRODUCTION_ADS = true;
export const ADS_ENABLED = true;

export const ADMOB_APP_ID = 'ca-app-pub-9717309889631554~2662088200';

// 1. App Open Ad Unit ID
export const APP_OPEN_AD_UNIT_ID = USE_PRODUCTION_ADS
  ? 'ca-app-pub-9717309889631554/2778558146'
  : TestIds.APP_OPEN;

// 2. Banner Ad Unit ID
export const BANNER_AD_UNIT_ID = USE_PRODUCTION_ADS
  ? 'ca-app-pub-9717309889631554/2531146131'
  : TestIds.ADAPTIVE_BANNER;

// 3. Get Files Rewarded Ad Unit ID
export const REWARDED_GET_FILES_ID = USE_PRODUCTION_ADS
  ? 'ca-app-pub-9717309889631554/2674530642'
  : TestIds.REWARDED;

// 4. Start Download Rewarded Ad Unit ID
export const REWARDED_START_DOWNLOAD_ID = USE_PRODUCTION_ADS
  ? 'ca-app-pub-9717309889631554/3177179249'
  : TestIds.REWARDED;

export const AD_UNIT_IDS = {
  APP_OPEN: APP_OPEN_AD_UNIT_ID,
  BANNER_HOME: BANNER_AD_UNIT_ID,
  BANNER_DOWNLOADS: BANNER_AD_UNIT_ID,
  BANNER_SETTINGS: BANNER_AD_UNIT_ID,
  REWARDED_GET_FILES: REWARDED_GET_FILES_ID,
  REWARDED_START_DOWNLOAD: REWARDED_START_DOWNLOAD_ID,
};
