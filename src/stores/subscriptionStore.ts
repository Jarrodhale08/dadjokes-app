/**
 * Subscription Store
 * Manages premium subscription status and features with 7-day free trial
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export type SubscriptionPlan = 'free' | 'trial' | 'monthly' | 'yearly';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  expiresAt: string | null;
  purchasedAt: string | null;
  autoRenew: boolean;
  trialUsed: boolean;
  trialStartedAt: string | null;
}

export interface SubscriptionState {
  subscription: SubscriptionInfo;
  isLoading: boolean;
  error: string | null;

  // Computed
  isPremium: () => boolean;
  isExpired: () => boolean;
  isInTrial: () => boolean;
  isTrialEligible: () => boolean;
  daysUntilExpiry: () => number | null;
  trialDaysRemaining: () => number | null;

  // Actions
  startTrial: () => Promise<void>;
  subscribe: (plan: 'monthly' | 'yearly') => Promise<void>;
  cancelSubscription: () => Promise<void>;
  restorePurchase: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const SUBSCRIPTION_KEY = 'subscription_info';

const saveSubscriptionSecurely = async (info: SubscriptionInfo) => {
  try {
    await SecureStore.setItemAsync(SUBSCRIPTION_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('Failed to save subscription securely:', error);
  }
};

const loadSubscriptionSecurely = async (): Promise<SubscriptionInfo | null> => {
  try {
    const data = await SecureStore.getItemAsync(SUBSCRIPTION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load subscription:', error);
    return null;
  }
};

const TRIAL_DAYS = 7;

const initialSubscription: SubscriptionInfo = {
  plan: 'free',
  expiresAt: null,
  purchasedAt: null,
  autoRenew: false,
  trialUsed: false,
  trialStartedAt: null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: initialSubscription,
      isLoading: false,
      error: null,

      isPremium: () => {
        const { subscription } = get();
        if (subscription.plan === 'free') return false;
        if (!subscription.expiresAt) return false;
        return new Date(subscription.expiresAt) > new Date();
      },

      isExpired: () => {
        const { subscription } = get();
        if (subscription.plan === 'free') return false;
        if (!subscription.expiresAt) return false;
        return new Date(subscription.expiresAt) <= new Date();
      },

      isInTrial: () => {
        const { subscription } = get();
        if (subscription.plan !== 'trial') return false;
        if (!subscription.expiresAt) return false;
        return new Date(subscription.expiresAt) > new Date();
      },

      isTrialEligible: () => {
        const { subscription } = get();
        return !subscription.trialUsed && subscription.plan === 'free';
      },

      daysUntilExpiry: () => {
        const { subscription } = get();
        if (!subscription.expiresAt) return null;
        const expiry = new Date(subscription.expiresAt);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      },

      trialDaysRemaining: () => {
        const { subscription, isInTrial } = get();
        if (!isInTrial()) return null;
        if (!subscription.expiresAt) return null;
        const expiry = new Date(subscription.expiresAt);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },

      startTrial: async () => {
        set({ isLoading: true, error: null });

        try {
          const { subscription } = get();
          if (subscription.trialUsed) {
            throw new Error('Trial already used');
          }

          await new Promise(resolve => setTimeout(resolve, 500));

          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

          const newSubscription: SubscriptionInfo = {
            plan: 'trial',
            purchasedAt: null,
            trialStartedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: false,
            trialUsed: true,
          };

          await saveSubscriptionSecurely(newSubscription);
          set({ subscription: newSubscription, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start trial',
            isLoading: false,
          });
          throw error;
        }
      },

      subscribe: async (plan: 'monthly' | 'yearly') => {
        set({ isLoading: true, error: null });

        try {
          // In a real app, this would integrate with:
          // - Apple StoreKit / In-App Purchases
          // - Google Play Billing
          // - RevenueCat or similar service

          // For demo purposes, we simulate a successful purchase
          await new Promise(resolve => setTimeout(resolve, 1500));

          const now = new Date();
          const expiresAt = new Date(now);

          if (plan === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          }

          const { subscription: currentSub } = get();
          const newSubscription: SubscriptionInfo = {
            plan,
            purchasedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: true,
            trialUsed: currentSub.trialUsed,
            trialStartedAt: currentSub.trialStartedAt,
          };

          await saveSubscriptionSecurely(newSubscription);
          set({ subscription: newSubscription, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Purchase failed',
            isLoading: false,
          });
          throw error;
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });

        try {
          await new Promise(resolve => setTimeout(resolve, 500));

          const { subscription } = get();
          const updatedSubscription: SubscriptionInfo = {
            ...subscription,
            autoRenew: false,
            trialUsed: subscription.trialUsed,
            trialStartedAt: subscription.trialStartedAt,
          };

          await saveSubscriptionSecurely(updatedSubscription);
          set({ subscription: updatedSubscription, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Cancellation failed',
            isLoading: false,
          });
          throw error;
        }
      },

      restorePurchase: async () => {
        set({ isLoading: true, error: null });

        try {
          // In a real app, this would verify purchases with the app store
          await new Promise(resolve => setTimeout(resolve, 1000));

          const savedSubscription = await loadSubscriptionSecurely();

          if (savedSubscription && savedSubscription.plan !== 'free') {
            // Check if still valid
            if (savedSubscription.expiresAt && new Date(savedSubscription.expiresAt) > new Date()) {
              set({ subscription: savedSubscription, isLoading: false });
              return true;
            }
          }

          set({ isLoading: false });
          return false;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Restore failed',
            isLoading: false,
          });
          return false;
        }
      },

      checkSubscriptionStatus: async () => {
        try {
          const savedSubscription = await loadSubscriptionSecurely();
          if (savedSubscription) {
            set({ subscription: savedSubscription });
          }
        } catch (error) {
          console.warn('Failed to check subscription status:', error);
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      reset: () => {
        set({ subscription: initialSubscription, isLoading: false, error: null });
        SecureStore.deleteItemAsync(SUBSCRIPTION_KEY).catch(console.warn);
      },
    }),
    {
      name: 'dadjokes-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive subscription metadata
        // Actual subscription validation should happen server-side
        subscription: {
          plan: state.subscription.plan,
          expiresAt: state.subscription.expiresAt,
          autoRenew: state.subscription.autoRenew,
          trialUsed: state.subscription.trialUsed,
          trialStartedAt: state.subscription.trialStartedAt,
        },
      }),
    }
  )
);

// Subscription pricing (for display purposes)
export const SUBSCRIPTION_PRICES = {
  monthly: {
    price: 2.99,
    currency: 'USD',
    period: 'month',
    savings: null,
  },
  yearly: {
    price: 19.99,
    currency: 'USD',
    period: 'year',
    savings: '44%',
  },
} as const;

// Trial configuration
export const FREE_TRIAL_DAYS = TRIAL_DAYS;

// Premium features list
export const PREMIUM_FEATURES = [
  {
    icon: '📚',
    title: 'Full Joke Library',
    description: 'Access 150+ curated dad jokes',
  },
  {
    icon: '🏷️',
    title: 'Category Filtering',
    description: 'Browse jokes by 12 different categories',
  },
  {
    icon: '🔥',
    title: 'Daily Joke Streak',
    description: 'Track your daily joke streak and earn badges',
  },
  {
    icon: '📁',
    title: 'Custom Collections',
    description: 'Organize jokes into personal collections',
  },
  {
    icon: '🔍',
    title: 'Search Library',
    description: 'Find the perfect joke instantly',
  },
  {
    icon: '🚫',
    title: 'Ad-Free Experience',
    description: 'Enjoy jokes without interruptions',
  },
] as const;

export default useSubscriptionStore;
