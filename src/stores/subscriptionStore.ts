/**
 * Subscription Store
 * Manages premium subscription status synced with RevenueCat
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo } from 'react-native-purchases';
import revenueCatService, { ENTITLEMENT_ID } from '../services/revenueCat.service';

export type SubscriptionPlan = 'free' | 'trial' | 'monthly' | 'yearly';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  expiresAt: string | null;
  purchasedAt: string | null;
  autoRenew: boolean;
  trialUsed: boolean;
  trialStartedAt: string | null;
  productIdentifier: string | null;
}

export interface SubscriptionState {
  subscription: SubscriptionInfo;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Computed
  isPremium: () => boolean;
  isExpired: () => boolean;
  isInTrial: () => boolean;
  isTrialEligible: () => boolean;
  daysUntilExpiry: () => number | null;
  trialDaysRemaining: () => number | null;

  // Actions
  initializeFromRevenueCat: () => Promise<void>;
  updateFromCustomerInfo: (customerInfo: CustomerInfo) => void;
  purchasePackage: (packageIdentifier: string) => Promise<boolean>;
  presentPaywall: () => Promise<boolean>;
  restorePurchase: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const TRIAL_DAYS = 7;

const initialSubscription: SubscriptionInfo = {
  plan: 'free',
  expiresAt: null,
  purchasedAt: null,
  autoRenew: false,
  trialUsed: false,
  trialStartedAt: null,
  productIdentifier: null,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: initialSubscription,
      isLoading: false,
      error: null,
      isInitialized: false,

      isPremium: () => {
        const { subscription } = get();
        if (subscription.plan === 'free') return false;
        if (!subscription.expiresAt) return subscription.plan !== 'free';
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

      initializeFromRevenueCat: async () => {
        set({ isLoading: true, error: null });

        try {
          const customerInfo = await revenueCatService.getCustomerInfo();

          if (customerInfo) {
            get().updateFromCustomerInfo(customerInfo);
          }

          set({ isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize subscription:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      updateFromCustomerInfo: (customerInfo: CustomerInfo) => {
        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        const trialUsed = customerInfo.allPurchasedProductIdentifiers.length > 0;

        if (entitlement) {
          // User has active entitlement
          const productIdentifier = entitlement.productIdentifier;
          const expirationDate = entitlement.expirationDate;
          const purchaseDate = entitlement.latestPurchaseDate;
          const willRenew = entitlement.willRenew;

          // Determine plan type from product identifier
          let plan: SubscriptionPlan = 'monthly';
          if (productIdentifier.includes('annual') || productIdentifier.includes('yearly')) {
            plan = 'yearly';
          }

          // Check if user is in trial period
          // Trial is detected when user has active entitlement but hasn't been charged yet
          const isInTrialPeriod = entitlement.periodType === 'TRIAL';

          if (isInTrialPeriod) {
            plan = 'trial';
          }

          set({
            subscription: {
              plan,
              expiresAt: expirationDate || null,
              purchasedAt: purchaseDate || null,
              autoRenew: willRenew,
              trialUsed: true,
              trialStartedAt: isInTrialPeriod ? purchaseDate : null,
              productIdentifier,
            },
          });
        } else {
          // User doesn't have active entitlement
          set({
            subscription: {
              plan: 'free',
              expiresAt: null,
              purchasedAt: null,
              autoRenew: false,
              trialUsed,
              trialStartedAt: null,
              productIdentifier: null,
            },
          });
        }
      },

      purchasePackage: async (packageIdentifier: string) => {
        set({ isLoading: true, error: null });

        try {
          const packages = await revenueCatService.getSubscriptionPackages();
          const pkg = packages.find((p) => p.identifier === packageIdentifier);

          if (!pkg) {
            throw new Error('Package not found');
          }

          const result = await revenueCatService.purchasePackage(pkg.package);

          if (result.userCancelled) {
            set({ isLoading: false });
            return false;
          }

          if (result.success && result.customerInfo) {
            get().updateFromCustomerInfo(result.customerInfo);
            set({ isLoading: false });
            return true;
          }

          throw new Error(result.error || 'Purchase failed');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Purchase failed',
            isLoading: false,
          });
          return false;
        }
      },

      presentPaywall: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await revenueCatService.presentPaywall();

          if (result.customerInfo) {
            get().updateFromCustomerInfo(result.customerInfo);
          }

          set({ isLoading: false });

          // Return true if user made a purchase or restored
          const { isPremium } = get();
          return isPremium();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to show paywall',
            isLoading: false,
          });
          return false;
        }
      },

      restorePurchase: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await revenueCatService.restorePurchases();

          if (result.customerInfo) {
            get().updateFromCustomerInfo(result.customerInfo);
          }

          set({ isLoading: false });
          return result.success;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Restore failed',
            isLoading: false,
          });
          return false;
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      reset: () => {
        set({
          subscription: initialSubscription,
          isLoading: false,
          error: null,
          isInitialized: false,
        });
      },
    }),
    {
      name: 'dadjokes-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    }
  )
);

// Subscription pricing (for display purposes - actual prices come from RevenueCat)
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
    description: 'Access 1,000+ curated dad jokes',
  },
  {
    icon: '🏷️',
    title: 'All Categories',
    description: 'Browse jokes by 12 different categories',
  },
  {
    icon: '🏆',
    title: 'Achievements',
    description: 'Unlock 20+ badges and track your progress',
  },
  {
    icon: '📜',
    title: 'Joke History',
    description: 'Browse all jokes you have viewed by date',
  },
  {
    icon: '📤',
    title: 'Export Favorites',
    description: 'Export your collection to share or backup',
  },
  {
    icon: '🔥',
    title: 'Streak Tracking',
    description: 'Track your daily streak and earn badges',
  },
  {
    icon: '📁',
    title: 'Custom Collections',
    description: 'Organize jokes into personal collections',
  },
  {
    icon: '🚫',
    title: 'Ad-Free Experience',
    description: 'Enjoy jokes without interruptions',
  },
] as const;

export default useSubscriptionStore;
