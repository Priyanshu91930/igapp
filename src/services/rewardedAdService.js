import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { REWARDED_GET_FILES_ID, REWARDED_START_DOWNLOAD_ID, ADS_ENABLED } from './adConfig';

class RewardedAdController {
  constructor(adUnitId, name) {
    this.adUnitId = adUnitId;
    this.name = name;
    this.ad = null;
    this.isLoaded = false;
    this.isLoading = false;
  }

  init() {
    if (!ADS_ENABLED || this.ad) return;

    try {
      this.ad = RewardedAd.createForAdRequest(this.adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      this.ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isLoaded = true;
        this.isLoading = false;
        console.log(`[RewardedAd:${this.name}] Loaded successfully`);
      });

      this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log(`[RewardedAd:${this.name}] Reward earned:`, reward);
      });

      this.ad.load();
      this.isLoading = true;
    } catch (e) {
      console.log(`[RewardedAd:${this.name}] Init error:`, e.message);
    }
  }

  async show() {
    if (!ADS_ENABLED) return false;

    try {
      if (!this.ad) {
        this.init();
      }

      if (this.isLoaded && this.ad) {
        await this.ad.show();
        this.isLoaded = false;

        // Auto preload next rewarded ad
        setTimeout(() => {
          if (this.ad) this.ad.load();
        }, 1000);
        return true;
      } else if (!this.isLoading && this.ad) {
        this.ad.load();
        this.isLoading = true;
      }
    } catch (e) {
      console.log(`[RewardedAd:${this.name}] Show error:`, e.message);
    }
    return false;
  }
}

export const getFilesAd = new RewardedAdController(REWARDED_GET_FILES_ID, 'GetFiles');
export const startDownloadAd = new RewardedAdController(REWARDED_START_DOWNLOAD_ID, 'StartDownload');

export function initAllRewardedAds() {
  getFilesAd.init();
  startDownloadAd.init();
}

export function showGetFilesAdIfAvailable() {
  return getFilesAd.show();
}

export function showStartDownloadAdIfAvailable() {
  return startDownloadAd.show();
}
