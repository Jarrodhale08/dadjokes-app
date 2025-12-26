/**
 * Subscription Screen
 * Displays RevenueCat Paywall UI or falls back to custom paywall
 *
 * Documentation: https://www.revenuecat.com/docs/tools/paywalls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  useSubscriptionStore,
  SUBSCRIPTION_PRICES,
  PREMIUM_FEATURES,
  FREE_TRIAL_DAYS,
} from '../src/stores/subscriptionStore';
import revenueCatService, { SubscriptionPackage } from '../src/services/revenueCat.service';
import { TOTAL_JOKES, TOTAL_CATEGORIES } from '../src/data/jokeLibrary';

type PlanType = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [useNativePaywall, setUseNativePaywall] = useState(true);

  const {
    subscription,
    isPremium,
    isInTrial,
    isTrialEligible,
    trialDaysRemaining,
    daysUntilExpiry,
    isLoading,
    error,
    presentPaywall,
    purchasePackage,
    restorePurchase,
    updateFromCustomerInfo,
  } = useSubscriptionStore();

  const premium = isPremium();
  const inTrial = isInTrial();
  const trialEligible = isTrialEligible();
  const trialDays = trialDaysRemaining();

  // Load packages from RevenueCat
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const pkgs = await revenueCatService.getSubscriptionPackages();
        setPackages(pkgs);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, []);

  // Try to present native RevenueCat paywall
  const handlePresentNativePaywall = useCallback(async () => {
    try {
      const result = await RevenueCatUI.presentPaywall();

      // Update subscription state
      const customerInfo = await revenueCatService.getCustomerInfo();
      if (customerInfo) {
        updateFromCustomerInfo(customerInfo);
      }

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Alert.alert(
          'Welcome to Premium!',
          'You now have access to all premium features.',
          [{ text: 'Start Exploring', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      console.error('Native paywall error:', err);
      // Fall back to custom paywall
      setUseNativePaywall(false);
    }
  }, [router, updateFromCustomerInfo]);

  // Show native paywall on mount for non-premium users
  useEffect(() => {
    if (!premium && !inTrial && useNativePaywall && !isLoadingPackages) {
      // Small delay to ensure screen is mounted
      const timer = setTimeout(() => {
        handlePresentNativePaywall();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [premium, inTrial, useNativePaywall, isLoadingPackages, handlePresentNativePaywall]);

  const handleSubscribe = async () => {
    const packageId = selectedPlan === 'yearly' ? '$rc_annual' : '$rc_monthly';
    const success = await purchasePackage(packageId);

    if (success) {
      Alert.alert(
        'Welcome to Premium!',
        'You now have access to the full joke library and all premium features.',
        [{ text: 'Start Exploring', onPress: () => router.back() }]
      );
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchase();
    if (restored) {
      Alert.alert('Restored!', 'Your subscription has been restored.');
    } else {
      Alert.alert(
        'No Purchase Found',
        "We couldn't find any previous purchases to restore."
      );
    }
  };

  const handleManageSubscription = () => {
    router.push('/customer-center');
  };

  // Get actual prices from packages if available
  const getPrice = (planType: PlanType) => {
    const pkg = packages.find((p) =>
      planType === 'yearly'
        ? p.identifier === '$rc_annual'
        : p.identifier === '$rc_monthly'
    );

    if (pkg) {
      return pkg.price;
    }

    // Fallback to static prices
    return planType === 'yearly'
      ? `$${SUBSCRIPTION_PRICES.yearly.price}`
      : `$${SUBSCRIPTION_PRICES.monthly.price}`;
  };

  const getTrialInfo = () => {
    const yearlyPkg = packages.find((p) => p.identifier === '$rc_annual');
    if (yearlyPkg?.hasFreeTrial) {
      return {
        hasFreeTrial: true,
        trialDays: yearlyPkg.trialDays,
        trialDescription: yearlyPkg.trialDescription,
      };
    }
    return { hasFreeTrial: trialEligible, trialDays: FREE_TRIAL_DAYS, trialDescription: '' };
  };

  const trialInfo = getTrialInfo();

  // If in trial, show trial status
  if (inTrial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Trial</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>FREE TRIAL</Text>
          </View>

          <View style={styles.trialCard}>
            <Text style={styles.trialDaysNumber}>{trialDays}</Text>
            <Text style={styles.trialDaysLabel}>days remaining</Text>
            <Text style={styles.trialExpiresText}>
              Trial expires on{' '}
              {subscription.expiresAt
                ? new Date(subscription.expiresAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>

          <Text style={styles.upgradePrompt}>
            Love the premium features? Subscribe now to keep them forever!
          </Text>

          {/* Plan Selection */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('yearly')}
            accessibilityLabel="Select yearly plan"
          >
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>BEST VALUE</Text>
            </View>
            <View style={styles.planCardContent}>
              <View>
                <Text style={styles.planCardTitle}>Yearly</Text>
                <Text style={styles.planCardPrice}>
                  {getPrice('yearly')}
                  <Text style={styles.planCardPeriod}>/year</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPlan === 'yearly' && styles.radioButtonSelected,
                ]}
              >
                {selectedPlan === 'yearly' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
            accessibilityLabel="Select monthly plan"
          >
            <View style={styles.planCardContent}>
              <View>
                <Text style={styles.planCardTitle}>Monthly</Text>
                <Text style={styles.planCardPrice}>
                  {getPrice('monthly')}
                  <Text style={styles.planCardPeriod}>/month</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPlan === 'monthly' && styles.radioButtonSelected,
                ]}
              >
                {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isLoading}
            accessibilityLabel={`Subscribe to ${selectedPlan} plan`}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                Subscribe Now - {getPrice(selectedPlan)}/{selectedPlan === 'yearly' ? 'year' : 'month'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If already premium, show management screen
  if (premium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM MEMBER</Text>
          </View>

          <View style={styles.subscriptionCard}>
            <Text style={styles.planName}>
              {subscription.plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan'}
            </Text>
            <Text style={styles.planDetails}>
              {subscription.autoRenew ? 'Renews automatically' : 'Expires'} on{' '}
              {subscription.expiresAt
                ? new Date(subscription.expiresAt).toLocaleDateString()
                : 'N/A'}
            </Text>
            {daysUntilExpiry() !== null && (
              <Text style={styles.daysRemaining}>{daysUntilExpiry()} days remaining</Text>
            )}

            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
              accessibilityLabel="Manage subscription"
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.featuresTitle}>Your Premium Features</Text>
          {PREMIUM_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Custom fallback paywall for non-premium users
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Premium</Text>
        <TouchableOpacity onPress={handleRestore} accessibilityLabel="Restore purchases">
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.heroSection}>
          <Text style={styles.heroEmoji}>😂</Text>
          <Text style={styles.heroTitle}>Unlock Premium Dad Jokes</Text>
          <Text style={styles.heroSubtitle}>
            Get access to {TOTAL_JOKES}+ jokes across {TOTAL_CATEGORIES} categories
          </Text>
        </LinearGradient>

        {/* Free Trial Banner */}
        {trialInfo.hasFreeTrial && (
          <View style={styles.trialBanner}>
            <View style={styles.trialBannerContent}>
              <View style={styles.trialBannerText}>
                <Text style={styles.trialBannerTitle}>
                  Try {trialInfo.trialDays} Days FREE
                </Text>
                <Text style={styles.trialBannerSubtitle}>
                  {trialInfo.trialDescription || 'No commitment required'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Features List */}
        <Text style={styles.featuresTitle}>Premium Features</Text>
        {PREMIUM_FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}

        {/* Plan Selection */}
        <Text style={styles.plansTitle}>Choose Your Plan</Text>

        {isLoadingPackages ? (
          <ActivityIndicator size="large" color="#EF4444" style={{ marginVertical: 20 }} />
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              accessibilityLabel="Select yearly plan"
            >
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>BEST VALUE</Text>
              </View>
              <View style={styles.planCardContent}>
                <View>
                  <Text style={styles.planCardTitle}>Yearly</Text>
                  <Text style={styles.planCardPrice}>
                    {getPrice('yearly')}
                    <Text style={styles.planCardPeriod}>/year</Text>
                  </Text>
                  {trialInfo.hasFreeTrial && (
                    <Text style={styles.trialBadgeSmall}>
                      {trialInfo.trialDays}-day free trial
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === 'yearly' && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPlan === 'yearly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              accessibilityLabel="Select monthly plan"
            >
              <View style={styles.planCardContent}>
                <View>
                  <Text style={styles.planCardTitle}>Monthly</Text>
                  <Text style={styles.planCardPrice}>
                    {getPrice('monthly')}
                    <Text style={styles.planCardPeriod}>/month</Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedPlan === 'monthly' && styles.radioButtonSelected,
                  ]}
                >
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Error Display */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={isLoading || isLoadingPackages}
          accessibilityLabel={`Subscribe to ${selectedPlan} plan`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {trialInfo.hasFreeTrial
                ? `Start ${trialInfo.trialDays}-Day Free Trial`
                : `Subscribe - ${getPrice(selectedPlan)}/${selectedPlan === 'yearly' ? 'year' : 'month'}`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Show RevenueCat Paywall Button */}
        <TouchableOpacity
          style={styles.nativePaywallButton}
          onPress={handlePresentNativePaywall}
        >
          <Text style={styles.nativePaywallText}>View All Options</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions
          auto-renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 44,
  },
  restoreText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 32,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  trialBanner: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialBannerText: {
    flex: 1,
  },
  trialBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  trialBannerSubtitle: {
    fontSize: 14,
    color: '#047857',
    marginTop: 2,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  planCardPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#EF4444',
  },
  planCardPeriod: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  trialBadgeSmall: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  savingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#EF4444',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 12,
  },
  subscribeButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nativePaywallButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nativePaywallText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    lineHeight: 18,
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  trialBadge: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  trialBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  trialCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 32,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  trialDaysNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#065F46',
  },
  trialDaysLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#047857',
    marginTop: -8,
  },
  trialExpiresText: {
    fontSize: 14,
    color: '#059669',
    marginTop: 12,
  },
  upgradePrompt: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  subscriptionCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  planDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  daysRemaining: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
    marginBottom: 16,
  },
  manageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
