/**
 * RevenueCat Service
 * Handles in-app purchases and subscription management using RevenueCat SDK
 *
 * Documentation: https://www.revenuecat.com/docs/getting-started/installation/reactnative
 */

import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesEntitlementInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Key from environment variables
const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  '';

// Entitlement ID - must match what's configured in RevenueCat dashboard
export const ENTITLEMENT_ID = 'dadjokes_pro';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'dadjokes_monthly',
  ANNUAL: 'dadjokes_yearly',
} as const;

export interface SubscriptionPackage {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceNumber: number;
  period: string;
  periodUnit: string;
  hasFreeTrial: boolean;
  trialDays: number;
  trialDescription: string;
  package: PurchasesPackage;
}

export interface TrialEligibility {
  isEligible: boolean;
  trialDays: number;
}

export interface PurchaseResult {
  success: boolean;
  customerInfo: CustomerInfo | null;
  error?: string;
  userCancelled?: boolean;
}

export interface PaywallResult {
  result: PAYWALL_RESULT;
  customerInfo?: CustomerInfo;
}

class RevenueCatService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize RevenueCat SDK
   * Should be called early in app lifecycle
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY === 'your_revenuecat_api_key_here') {
        console.warn('RevenueCat API key not configured. Purchases will not work.');
        return;
      }

      // Set log level for debugging (use VERBOSE in development, ERROR in production)
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.ERROR);
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: null, // Let RevenueCat generate anonymous ID initially
      });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Get formatted subscription packages from current offering
   */
  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    try {
      const offerings = await this.getOfferings();

      if (!offerings?.current?.availablePackages) {
        console.warn('No offerings available');
        return [];
      }

      return offerings.current.availablePackages.map((pkg) => {
        const product = pkg.product;
        const trialInfo = this.getPackageTrialInfo(pkg);

        return {
          identifier: pkg.identifier,
          title: product.title,
          description: product.description,
          price: product.priceString,
          priceNumber: product.price,
          period: this.getPeriodString(pkg.packageType),
          periodUnit: pkg.packageType,
          hasFreeTrial: trialInfo.hasFreeTrial,
          trialDays: trialInfo.trialDays,
          trialDescription: trialInfo.trialDescription,
          package: pkg,
        };
      });
    } catch (error) {
      console.error('Failed to get subscription packages:', error);
      return [];
    }
  }

  /**
   * Get trial info for a package
   */
  getPackageTrialInfo(pkg: PurchasesPackage): {
    hasFreeTrial: boolean;
    trialDays: number;
    trialDescription: string;
  } {
    const product = pkg.product;

    // Check for introductory price (free trial)
    if (product.introPrice && product.introPrice.price === 0) {
      const trialPeriod = product.introPrice.periodNumberOfUnits || 7;
      const periodUnit = product.introPrice.periodUnit || 'DAY';

      let trialDays = trialPeriod;
      if (periodUnit === 'WEEK') trialDays = trialPeriod * 7;
      if (periodUnit === 'MONTH') trialDays = trialPeriod * 30;

      const unitLabel = periodUnit.toLowerCase();
      return {
        hasFreeTrial: true,
        trialDays,
        trialDescription: `${trialPeriod} ${unitLabel}${trialPeriod > 1 ? 's' : ''} free`,
      };
    }

    return {
      hasFreeTrial: false,
      trialDays: 0,
      trialDescription: '',
    };
  }

  /**
   * Check if user is eligible for free trial
   */
  async checkTrialEligibility(): Promise<TrialEligibility> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return { isEligible: true, trialDays: 7 }; // Default to eligible if not initialized
      }

      const customerInfo = await Purchases.getCustomerInfo();

      // User is eligible for trial if they've never made a purchase
      const hasUsedTrial = customerInfo.allPurchasedProductIdentifiers.length > 0;

      return {
        isEligible: !hasUsedTrial,
        trialDays: 7,
      };
    } catch (error) {
      console.error('Failed to check trial eligibility:', error);
      return { isEligible: true, trialDays: 7 };
    }
  }

  /**
   * Check if user has previously used a trial
   */
  async hasUsedTrial(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return false;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.allPurchasedProductIdentifiers.length > 0;
    } catch (error) {
      console.error('Failed to check trial usage:', error);
      return false;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return {
          success: false,
          customerInfo: null,
          error: 'RevenueCat not initialized',
        };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Check if purchase was successful by verifying entitlement
      const hasPremium = this.hasPremiumEntitlement(customerInfo);

      return {
        success: hasPremium,
        customerInfo,
      };
    } catch (error) {
      const purchaseError = error as PurchasesError;

      // Handle user cancellation gracefully
      if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return {
          success: false,
          customerInfo: null,
          userCancelled: true,
        };
      }

      console.error('Purchase failed:', error);
      return {
        success: false,
        customerInfo: null,
        error: purchaseError.message || 'Purchase failed',
      };
    }
  }

  /**
   * Present the RevenueCat Paywall UI
   * Uses the paywall configured in RevenueCat dashboard
   *
   * Documentation: https://www.revenuecat.com/docs/tools/paywalls
   */
  async presentPaywall(): Promise<PaywallResult> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return { result: PAYWALL_RESULT.ERROR };
      }

      const result = await RevenueCatUI.presentPaywall();

      // Get updated customer info after paywall interaction
      const customerInfo = await this.getCustomerInfo();

      return {
        result,
        customerInfo: customerInfo || undefined,
      };
    } catch (error) {
      console.error('Failed to present paywall:', error);
      return { result: PAYWALL_RESULT.ERROR };
    }
  }

  /**
   * Present paywall if user doesn't have premium entitlement
   * Returns true if user now has premium access
   */
  async presentPaywallIfNeeded(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return false;
      }

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<PurchaseResult> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return {
          success: false,
          customerInfo: null,
          error: 'RevenueCat not initialized',
        };
      }

      const customerInfo = await Purchases.restorePurchases();
      const hasPremium = this.hasPremiumEntitlement(customerInfo);

      return {
        success: hasPremium,
        customerInfo,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        customerInfo: null,
        error: 'Failed to restore purchases',
      };
    }
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumStatus(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return false;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return this.hasPremiumEntitlement(customerInfo);
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Check if customer info has the Dad Jokes Pro entitlement
   */
  hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  }

  /**
   * Get the active entitlement details
   */
  getActiveEntitlement(customerInfo: CustomerInfo): PurchasesEntitlementInfo | null {
    return customerInfo.entitlements.active[ENTITLEMENT_ID] || null;
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Add customer info update listener
   * Returns cleanup function
   */
  addCustomerInfoUpdateListener(
    callback: (customerInfo: CustomerInfo) => void
  ): () => void {
    return Purchases.addCustomerInfoUpdateListener(callback);
  }

  /**
   * Log in user with app user ID
   * Use this when user signs in to your app
   */
  async login(appUserID: string): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      const { customerInfo } = await Purchases.logIn(appUserID);
      return customerInfo;
    } catch (error) {
      console.error('Failed to log in user:', error);
      return null;
    }
  }

  /**
   * Log out user
   * Creates a new anonymous user
   */
  async logout(): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      const customerInfo = await Purchases.logOut();
      return customerInfo;
    } catch (error) {
      console.error('Failed to log out user:', error);
      return null;
    }
  }

  /**
   * Get current app user ID
   */
  async getAppUserID(): Promise<string | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      return await Purchases.getAppUserID();
    } catch (error) {
      console.error('Failed to get app user ID:', error);
      return null;
    }
  }

  /**
   * Check if current user is anonymous
   */
  async isAnonymous(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return true;
      }

      return await Purchases.isAnonymous();
    } catch (error) {
      console.error('Failed to check anonymous status:', error);
      return true;
    }
  }

  /**
   * Sync purchases with RevenueCat
   * Useful for debugging or ensuring purchase state is up to date
   */
  async syncPurchases(): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      const customerInfo = await Purchases.syncPurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to sync purchases:', error);
      return null;
    }
  }

  /**
   * Convert package type to readable period string
   */
  private getPeriodString(packageType: string): string {
    switch (packageType) {
      case 'MONTHLY':
        return 'month';
      case 'ANNUAL':
        return 'year';
      case 'WEEKLY':
        return 'week';
      case 'LIFETIME':
        return 'lifetime';
      case 'SIX_MONTH':
        return '6 months';
      case 'THREE_MONTH':
        return '3 months';
      case 'TWO_MONTH':
        return '2 months';
      default:
        return 'period';
    }
  }
}

export const revenueCatService = new RevenueCatService();
export default revenueCatService;
