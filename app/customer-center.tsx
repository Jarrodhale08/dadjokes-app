import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { Platform } from 'react-native';

export default function CustomerCenterScreen() {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    subscription,
    isPremium,
    isInTrial,
    daysUntilExpiry,
    restorePurchase,
    isLoading,
  } = useSubscriptionStore();

  const premium = isPremium();
  const inTrial = isInTrial();
  const daysRemaining = daysUntilExpiry();

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const restored = await restorePurchase();
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your subscription has been successfully restored.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any previous purchases to restore. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'There was an error restoring your purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleContactSupport = () => {
    const email = 'support@dadjokes.com';
    const subject = 'Subscription Support Request';
    const body = `User ID: ${subscription.purchasedAt ? 'Premium' : 'Free'}
Platform: ${Platform.OS}
Subscription Plan: ${subscription.plan}

Please describe your issue:
`;

    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const getExpirationDate = () => {
    if (!subscription.expiresAt) return 'N/A';
    return new Date(subscription.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPurchaseDate = () => {
    if (!subscription.purchasedAt) return 'N/A';
    return new Date(subscription.purchasedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = () => {
    switch (subscription.plan) {
      case 'trial':
        return 'Free Trial';
      case 'monthly':
        return 'Monthly Plan';
      case 'yearly':
        return 'Yearly Plan';
      case 'free':
        return 'Free Plan';
      default:
        return 'Unknown Plan';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Loading subscription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusBadgeContainer}>
          {premium || inTrial ? (
            <View style={[styles.statusBadge, styles.premiumBadge]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.premiumBadgeText}>
                {inTrial ? 'FREE TRIAL ACTIVE' : 'PREMIUM ACTIVE'}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.freeBadge]}>
              <Text style={styles.freeBadgeText}>FREE PLAN</Text>
            </View>
          )}
        </View>

        {/* Subscription Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Plan</Text>
            <Text style={styles.detailValue}>{getPlanName()}</Text>
          </View>

          {(premium || inTrial) && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, styles.activeStatus]}>
                  {subscription.autoRenew ? 'Active - Auto-renewing' : 'Active - Expires at end of period'}
                </Text>
              </View>

              {daysRemaining !== null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days Remaining</Text>
                  <Text style={styles.detailValue}>
                    {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {subscription.autoRenew ? 'Renewal Date' : 'Expiration Date'}
                </Text>
                <Text style={styles.detailValue}>{getExpirationDate()}</Text>
              </View>

              {subscription.purchasedAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purchase Date</Text>
                  <Text style={styles.detailValue}>{getPurchaseDate()}</Text>
                </View>
              )}
            </>
          )}

          {!premium && !inTrial && (
            <View style={styles.upgradePromptContainer}>
              <Text style={styles.upgradePromptText}>
                Upgrade to Premium to unlock all features and support dad joke excellence!
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => router.push('/subscription')}
                accessibilityLabel="Upgrade to Premium"
              >
                <Text style={styles.upgradeButtonText}>View Premium Plans</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Management Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manage Subscription</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            accessibilityLabel="Restore purchases"
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={colors.text.primary} />
            )}
            <Text style={styles.actionButtonText}>Restore Purchases</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          {(premium || inTrial) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleManageSubscription}
              accessibilityLabel="Manage subscription"
            >
              <Ionicons name="card" size={20} color={colors.text.primary} />
              <Text style={styles.actionButtonText}>
                Manage in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
            accessibilityLabel="Contact support"
          >
            <Ionicons name="mail" size={20} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary.DEFAULT} />
          <Text style={styles.infoText}>
            Subscriptions are managed through {Platform.OS === 'ios' ? 'Apple' : 'Google'}.
            To cancel or modify your subscription, use the{' '}
            {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} subscription management.
          </Text>
        </View>

        {/* Trial Info */}
        {inTrial && (
          <View style={styles.trialInfoCard}>
            <Text style={styles.trialInfoTitle}>About Your Free Trial</Text>
            <Text style={styles.trialInfoText}>
              Your free trial gives you full access to all premium features. When your trial ends,
              you can subscribe to keep enjoying premium benefits, or continue with the free version.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
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
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: '#ECFDF5',
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  freeBadge: {
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  freeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  activeStatus: {
    color: colors.success,
  },
  upgradePromptContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  upgradePromptText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  trialInfoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  trialInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  trialInfoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
