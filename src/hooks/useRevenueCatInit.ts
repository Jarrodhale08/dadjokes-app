/**
 * RevenueCat Initialization Hook
 * Initializes RevenueCat SDK and sets up customer info listener
 */

import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';
import revenueCatService from '../services/revenueCat.service';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export interface RevenueCatInitState {
  isReady: boolean;
  error: string | null;
}

export function useRevenueCatInit(): RevenueCatInitState {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let customerInfoUpdateListener: (() => void) | null = null;

    const initRevenueCat = async () => {
      try {
        // Initialize RevenueCat SDK
        await revenueCatService.initialize();

        if (!isMounted) return;

        // Set up customer info listener to update subscription state
        customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          if (!isMounted) return;

          // Check if user has premium entitlement
          const hasPremium = revenueCatService.hasPremiumEntitlement(customerInfo);

          // Get subscription store to update state
          const subscriptionStore = useSubscriptionStore.getState();

          // Update subscription based on entitlement status
          if (hasPremium) {
            const activeEntitlement = customerInfo.entitlements.active['dadjokes_pro'];

            if (activeEntitlement) {
              const expirationDate = activeEntitlement.expirationDate;
              const willRenew = activeEntitlement.willRenew;
              const productIdentifier = activeEntitlement.productIdentifier;

              // Determine plan type from product identifier
              let plan: 'monthly' | 'yearly' = 'monthly';
              if (productIdentifier.includes('annual') || productIdentifier.includes('yearly')) {
                plan = 'yearly';
              }

              // Check if in trial period
              const isInTrialPeriod = activeEntitlement.isActive &&
                                      customerInfo.allPurchasedProductIdentifiers.length === 0;

              // Update subscription state
              subscriptionStore.subscription = {
                plan: isInTrialPeriod ? 'trial' : plan,
                expiresAt: expirationDate || null,
                purchasedAt: activeEntitlement.latestPurchaseDate || null,
                autoRenew: willRenew,
                trialUsed: customerInfo.allPurchasedProductIdentifiers.length > 0,
                trialStartedAt: isInTrialPeriod ?
                  (activeEntitlement.latestPurchaseDate || new Date().toISOString()) :
                  null,
              };
            }
          } else {
            // User doesn't have active entitlement - check if trial was used
            const trialUsed = customerInfo.allPurchasedProductIdentifiers.length > 0;

            subscriptionStore.subscription = {
              plan: 'free',
              expiresAt: null,
              purchasedAt: null,
              autoRenew: false,
              trialUsed,
              trialStartedAt: null,
            };
          }
        });

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('RevenueCat initialization error:', err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize RevenueCat');
          setIsReady(false);
        }
      }
    };

    initRevenueCat();

    // Cleanup
    return () => {
      isMounted = false;
      if (customerInfoUpdateListener) {
        customerInfoUpdateListener();
      }
    };
  }, []);

  return { isReady, error };
}

export default useRevenueCatInit;
