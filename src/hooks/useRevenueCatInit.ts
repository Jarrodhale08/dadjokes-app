/**
 * RevenueCat Initialization Hook
 * Initializes RevenueCat SDK and syncs subscription state
 */

import { useEffect, useState, useCallback } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import revenueCatService from '../services/revenueCat.service';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export interface RevenueCatInitState {
  isReady: boolean;
  error: string | null;
}

export function useRevenueCatInit(): RevenueCatInitState {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFromCustomerInfo = useSubscriptionStore(
    (state) => state.updateFromCustomerInfo
  );

  const handleCustomerInfoUpdate = useCallback(
    (customerInfo: CustomerInfo) => {
      updateFromCustomerInfo(customerInfo);
    },
    [updateFromCustomerInfo]
  );

  useEffect(() => {
    let isMounted = true;
    let removeListener: (() => void) | null = null;

    const initRevenueCat = async () => {
      try {
        // Initialize RevenueCat SDK
        await revenueCatService.initialize();

        if (!isMounted) return;

        // Get initial customer info
        const customerInfo = await revenueCatService.getCustomerInfo();

        if (!isMounted) return;

        // Update store with initial state
        if (customerInfo) {
          handleCustomerInfoUpdate(customerInfo);
        }

        // Set up listener for customer info updates
        removeListener = revenueCatService.addCustomerInfoUpdateListener(
          (updatedCustomerInfo) => {
            if (isMounted) {
              handleCustomerInfoUpdate(updatedCustomerInfo);
            }
          }
        );

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('RevenueCat initialization error:', err);

        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize RevenueCat'
          );
          // Still mark as ready so app can function without RevenueCat
          setIsReady(true);
        }
      }
    };

    initRevenueCat();

    // Cleanup
    return () => {
      isMounted = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [handleCustomerInfoUpdate]);

  return { isReady, error };
}

export default useRevenueCatInit;
