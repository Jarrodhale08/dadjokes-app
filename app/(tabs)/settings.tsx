import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { useAppStore } from '../../src/stores/appStore';
import { colors } from '../../src/theme/colors';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  badge?: string | undefined;
  isPremium?: boolean;
}

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { isPremium, isInTrial, subscription, trialDaysRemaining } = useSubscriptionStore();
  const { streak } = useAppStore();

  const premium = isPremium();
  const inTrial = isInTrial();
  const trialDays = trialDaysRemaining();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleItemPress = useCallback((item: SettingsItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  }, [router]);

  const getSubscriptionStatus = () => {
    if (inTrial) {
      return `${trialDays} days left in trial`;
    }
    if (premium) {
      return subscription.plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan';
    }
    return 'Free Plan';
  };

  const accountItems: SettingsItem[] = [
    {
      id: 'subscription',
      title: premium || inTrial ? 'Manage Subscription' : 'Go Premium',
      subtitle: getSubscriptionStatus(),
      icon: premium ? 'star' : 'star-outline',
      route: '/subscription',
      badge: inTrial ? '🎁' : premium ? '⭐' : undefined,
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Your account details',
      icon: 'person-outline',
      route: '/settings/profile',
    },
    {
      id: 'sync',
      title: 'Data & Sync',
      subtitle: 'Cloud backup & sync settings',
      icon: 'cloud-outline',
      route: '/settings/sync',
    },
  ];

  const appItems: SettingsItem[] = [
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Daily joke reminders & alerts',
      icon: 'notifications-outline',
      route: '/settings/notifications',
    },
    {
      id: 'categories',
      title: 'Joke Categories',
      subtitle: 'Customize your joke preferences',
      icon: 'pricetags-outline',
      route: '/settings/categories',
    },
  ];

  const premiumItems: SettingsItem[] = [
    {
      id: 'streak',
      title: 'Your Streak',
      subtitle: streak.currentStreak > 0
        ? `${streak.currentStreak} day${streak.currentStreak !== 1 ? 's' : ''} • Best: ${streak.longestStreak}`
        : 'Start your streak today!',
      icon: 'flame-outline',
      route: '/settings/streak',
      badge: streak.currentStreak >= 7 ? '🔥' : undefined,
      isPremium: true,
    },
    {
      id: 'achievements',
      title: 'Achievements',
      subtitle: 'Track your progress and unlock badges',
      icon: 'trophy-outline',
      route: '/settings/achievements',
      badge: '🏆',
      isPremium: true,
    },
    {
      id: 'joke-history',
      title: 'Joke History',
      subtitle: 'Browse all jokes you have viewed',
      icon: 'time-outline',
      route: '/settings/joke-history',
      isPremium: true,
    },
    {
      id: 'collections',
      title: 'My Collections',
      subtitle: 'Organize jokes into custom lists',
      icon: 'folder-outline',
      route: '/settings/collections',
      isPremium: true,
    },
  ];

  const supportItems: SettingsItem[] = [
    {
      id: 'support',
      title: 'Help & Support',
      subtitle: 'FAQ, contact, feedback',
      icon: 'help-circle-outline',
      route: '/settings/support',
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App info & credits',
      icon: 'information-circle-outline',
      route: '/settings/about',
    },
  ];

  const legalItems: SettingsItem[] = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      route: '/settings/privacy',
    },
  ];

  const renderSection = (title: string, items: SettingsItem[], showLock = false) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.listContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.listItem,
              index === items.length - 1 && styles.listItemLast
            ]}
            onPress={() => {
              if (showLock && item.isPremium && !premium && !inTrial) {
                router.push('/subscription');
              } else {
                handleItemPress(item);
              }
            }}
            accessibilityLabel={`${item.title} setting`}
            accessibilityRole="button"
          >
            <View style={styles.listItemLeft}>
              <View style={[styles.iconContainer, item.isPremium && !premium && !inTrial && styles.iconContainerLocked]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.isPremium && !premium && !inTrial ? colors.text.muted : colors.primary.DEFAULT}
                />
              </View>
              <View style={styles.listItemTextContainer}>
                <View style={styles.listItemTitleRow}>
                  <Text style={[styles.listItemTitle, item.isPremium && !premium && !inTrial && styles.listItemTitleLocked]}>
                    {item.title}
                  </Text>
                  {item.badge && <Text style={styles.badge}>{item.badge}</Text>}
                  {item.isPremium && !premium && !inTrial && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={12} color={colors.primary.dark} />
                    </View>
                  )}
                </View>
                {item.subtitle && (
                  <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        <Text style={styles.title}>Settings</Text>

        {/* Streak Card for Premium Users */}
        {(premium || inTrial) && streak.currentStreak > 0 && (
          <TouchableOpacity
            style={styles.streakCard}
            onPress={() => router.push('/settings/streak')}
          >
            <View style={styles.streakCardContent}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View style={styles.streakCardText}>
                <Text style={styles.streakCardTitle}>
                  {streak.currentStreak} Day Streak!
                </Text>
                <Text style={styles.streakCardSubtitle}>
                  Keep it going - view a joke today
                </Text>
              </View>
            </View>
            {streak.streakBadges.length > 0 && (
              <Text style={styles.badgeRow}>{streak.streakBadges.join(' ')}</Text>
            )}
          </TouchableOpacity>
        )}

        {renderSection('Account', accountItems)}
        {renderSection('App Settings', appItems)}
        {renderSection('Premium Features', premiumItems, true)}
        {renderSection('Support', supportItems)}
        {renderSection('Legal', legalItems)}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dad Jokes v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with 😂 for dad joke enthusiasts</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    color: colors.text.primary,
  },
  streakCard: {
    backgroundColor: colors.primary.muted,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  streakCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  streakCardText: {
    flex: 1,
  },
  streakCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary.dark,
  },
  streakCardSubtitle: {
    fontSize: 14,
    color: colors.mustache,
    marginTop: 2,
  },
  badgeRow: {
    fontSize: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  listContainer: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerLocked: {
    backgroundColor: colors.surface.overlay,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  listItemTitleLocked: {
    color: colors.text.muted,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  badge: {
    fontSize: 16,
    marginLeft: 6,
  },
  premiumBadge: {
    backgroundColor: colors.primary.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 4,
  },
});
