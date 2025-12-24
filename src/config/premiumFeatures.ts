/**
 * Premium Features Configuration for Dad Jokes
 *
 * Defines free tier limits and premium feature gates.
 */

export const FREE_TIER_LIMITS = {
  // Joke Features
  maxFavorites: 25,               // Free users can save up to 25 favorite jokes
  maxCustomJokes: 5,              // Free users can create 5 custom jokes
  dailyJokeLimit: 10,             // Free users get 10 jokes per day

  // Categories
  allCategories: false,           // Premium unlocks all joke categories

  // Sharing
  shareWithWatermark: true,       // Free users share with app watermark

  // Features
  offlineMode: false,             // Offline joke access is premium
  adFree: false,                  // Ad-free experience is premium
  jokeOfTheDay: true,             // Free users get joke of the day

  // Customization
  customThemes: false,            // Custom themes are premium

  // Stats
  basicStats: true,               // Basic laugh stats available
  advancedStats: false,           // Detailed stats are premium

  // Sync & Backup
  cloudSync: false,               // Cloud sync across devices is premium
  dataExport: false,              // Export favorites is premium
};

export const PREMIUM_FEATURES = [
  {
    id: 'unlimited_favorites',
    name: 'Unlimited Favorites',
    description: 'Save as many jokes as you want to your favorites',
    icon: 'heart',
  },
  {
    id: 'all_categories',
    name: 'All Joke Categories',
    description: 'Access every joke category including exclusive ones',
    icon: 'albums',
  },
  {
    id: 'ad_free',
    name: 'Ad-Free Experience',
    description: 'Enjoy jokes without any advertisements',
    icon: 'eye-off',
  },
  {
    id: 'offline_mode',
    name: 'Offline Mode',
    description: 'Access your favorite jokes without internet',
    icon: 'cloud-offline',
  },
  {
    id: 'clean_sharing',
    name: 'Clean Sharing',
    description: 'Share jokes without watermarks',
    icon: 'share-social',
  },
  {
    id: 'custom_themes',
    name: 'Custom Themes',
    description: 'Personalize the app with different color themes',
    icon: 'color-palette',
  },
  {
    id: 'cloud_sync',
    name: 'Cloud Sync',
    description: 'Sync your favorites across all your devices',
    icon: 'cloud-upload',
  },
  {
    id: 'advanced_stats',
    name: 'Joke Stats',
    description: 'See detailed statistics about your joke habits',
    icon: 'stats-chart',
  },
];

export const ENTITLEMENT_ID = 'dadjokes_pro';

export const TRIAL_DAYS = 7;

/**
 * Check if a feature is available for the current user
 */
export function isFeatureAvailable(
  featureKey: keyof typeof FREE_TIER_LIMITS,
  isPremium: boolean
): boolean {
  if (isPremium) return true;

  const limit = FREE_TIER_LIMITS[featureKey];
  return typeof limit === 'boolean' ? limit : true;
}

/**
 * Get the limit for a feature
 */
export function getFeatureLimit(
  featureKey: keyof typeof FREE_TIER_LIMITS,
  isPremium: boolean
): number | boolean {
  if (isPremium) return Infinity;
  return FREE_TIER_LIMITS[featureKey];
}

/**
 * Check if user has reached their limit for a countable feature
 */
export function hasReachedLimit(
  featureKey: keyof typeof FREE_TIER_LIMITS,
  currentCount: number,
  isPremium: boolean
): boolean {
  if (isPremium) return false;

  const limit = FREE_TIER_LIMITS[featureKey];
  if (typeof limit !== 'number') return false;

  return currentCount >= limit;
}
