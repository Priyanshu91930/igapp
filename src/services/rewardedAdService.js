import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
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

  show() {
    if (!ADS_ENABLED) return Promise.resolve(false);

    return new Promise((resolve) => {
      try {
        if (!this.ad || !this.isLoaded) {
          if (!this.isLoading) this.init();
          return resolve(false);
        }

        let unsubClosed = null;
        let unsubEarned = null;

        const cleanup = () => {
          if (typeof unsubClosed === 'function') unsubClosed();
          if (typeof unsubEarned === 'function') unsubEarned();
          this.isLoaded = false;

          // Auto preload next rewarded ad
          setTimeout(() => {
            if (this.ad) this.ad.load();
          }, 1000);
        };

        if (AdEventType && AdEventType.CLOSED) {
          unsubClosed = this.ad.addAdEventListener(AdEventType.CLOSED, () => {
            console.log(`[RewardedAd:${this.name}] Ad CLOSED by user`);
            cleanup();
            resolve(true);
          });
        }

        unsubEarned = this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          console.log(`[RewardedAd:${this.name}] Reward earned:`, reward);
        });

        this.ad.show().catch((e) => {
          console.log(`[RewardedAd:${this.name}] Show error:`, e.message);
          cleanup();
          resolve(false);
        });
      } catch (e) {
        console.log(`[RewardedAd:${this.name}] Exception during show:`, e.message);
        resolve(false);
      }
    });
  }
}

export const getFilesAd = new RewardedAdController(REWARDED_GET_FILES_ID, 'GetFiles');
export const startDownloadAd = new RewardedAdController(REWARDED_START_DOWNLOAD_ID, 'StartDownload');

export function initAllRewardedAds() {
  getFilesAd.init();
  startDownloadAd.init();
}

export function showGetFilesAdIfAvailable() {
  return Promise.resolve(false);
}

export function showStartDownloadAdIfAvailable() {
  return startDownloadAd.show();
}
