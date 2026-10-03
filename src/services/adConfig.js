import { TestIds } from 'react-native-google-mobile-ads';

// Centralized AdMob Ad Unit configuration for Insta Downloader
const USE_PRODUCTION_ADS = false;

export const AD_UNIT_IDS = {
  BANNER_HOME: USE_PRODUCTION_ADS ? 'ca-app-pub-3940256099942544/6300978111' : TestIds.ADAPTIVE_BANNER,
  BANNER_DOWNLOADS: USE_PRODUCTION_ADS ? 'ca-app-pub-3940256099942544/6300978111' : TestIds.ADAPTIVE_BANNER,
  BANNER_SETTINGS: USE_PRODUCTION_ADS ? 'ca-app-pub-3940256099942544/6300978111' : TestIds.ADAPTIVE_BANNER,
  APP_OPEN: USE_PRODUCTION_ADS ? 'ca-app-pub-3940256099942544/9257395921' : TestIds.APP_OPEN,
  INTERSTITIAL: USE_PRODUCTION_ADS ? 'ca-app-pub-3940256099942544/1033173712' : TestIds.INTERSTITIAL,
};

// ADS_ENABLED set to false as requested by user
export const ADS_ENABLED = false;
