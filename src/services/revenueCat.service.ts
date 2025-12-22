/**
 * RevenueCat Service
 * Handles in-app purchases and subscription management
 */

import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  '';

const ENTITLEMENT_ID = 'dadjokes_pro';

export interface SubscriptionPackage {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceNumber: number;
  period: string;
  hasFreeTrial: boolean;
  trialDays: number;
  package: PurchasesPackage;
}

export interface TrialEligibility {
  isEligible: boolean;
  trialDays: number;
}

class RevenueCatService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize RevenueCat SDK
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

      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
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
   * Get formatted subscription packages
   */
  async getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    try {
      const offerings = await this.getOfferings();

      if (!offerings?.current?.availablePackages) {
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
          hasFreeTrial: trialInfo.hasFreeTrial,
          trialDays: trialInfo.trialDays,
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

      return {
        hasFreeTrial: true,
        trialDays,
        trialDescription: `${trialPeriod} ${periodUnit.toLowerCase()}${trialPeriod > 1 ? 's' : ''} free trial`,
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
        return { isEligible: false, trialDays: 7 };
      }

      const customerInfo = await Purchases.getCustomerInfo();

      // Check if user has ever had the entitlement
      const hasUsedTrial = customerInfo.allPurchasedProductIdentifiers.length > 0;

      return {
        isEligible: !hasUsedTrial,
        trialDays: 7,
      };
    } catch (error) {
      console.error('Failed to check trial eligibility:', error);
      return { isEligible: false, trialDays: 7 };
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
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        throw new Error('RevenueCat not initialized');
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        return null;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return null;
      }

      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return null;
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
   * Check if customer info has premium entitlement
   */
  hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
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
   * Set user ID for attribution
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return;
      }

      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Log out user
   */
  async logout(): Promise<void> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return;
      }

      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  /**
   * Present the RevenueCat paywall UI
   */
  async presentPaywall(): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.isInitialized) {
        return false;
      }

      // Note: RevenueCatUI paywall requires additional setup
      // For now, return false and let the app use its own paywall
      return false;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      return false;
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
      default:
        return 'period';
    }
  }
}

export const revenueCatService = new RevenueCatService();
export default revenueCatService;
