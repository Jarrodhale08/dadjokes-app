/**
 * Joke History Screen (Premium Feature)
 * Shows archive of jokes viewed over time, organized by date
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { CATEGORY_INFO } from '../../src/data/jokeLibrary';
import { colors } from '../../src/theme/colors';

interface HistorySection {
  title: string;
  date: string;
  data: {
    id: string;
    joke: string;
    category?: string;
    viewedAt: string;
  }[];
}

export default function JokeHistoryScreen() {
  const router = useRouter();
  const { jokeHistory, clearHistory, toggleFavorite, favorites } = useAppStore();
  const { isPremium } = useSubscriptionStore();
  const premium = isPremium();

  // Group jokes by date
  const sections = useMemo<HistorySection[]>(() => {
    const grouped: Record<string, HistorySection> = {};

    jokeHistory.forEach((entry) => {
      if (!grouped[entry.date]) {
        const date = new Date(entry.date);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let title = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        if (entry.date === today) {
          title = 'Today';
        } else if (entry.date === yesterdayStr) {
          title = 'Yesterday';
        }

        grouped[entry.date] = {
          title,
          date: entry.date,
          data: [],
        };
      }

      const group = grouped[entry.date];
      if (group) {
        group.data.push({
          id: entry.id,
          joke: entry.joke,
          ...(entry.category ? { category: entry.category } : {}),
          viewedAt: entry.viewedAt,
        });
      }
    });

    // Sort by date descending
    return Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [jokeHistory]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your entire joke history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  }, [clearHistory]);

  const handleToggleFavorite = useCallback(
    (jokeId: string) => {
      toggleFavorite(jokeId);
    },
    [toggleFavorite]
  );

  // Show paywall if not premium
  if (!premium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/settings')}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Joke History</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.paywallContainer}>
          <View style={styles.premiumIcon}>
            <Ionicons name="time" size={64} color={colors.primary.DEFAULT} />
          </View>
          <Text style={styles.paywallTitle}>Premium Feature</Text>
          <Text style={styles.paywallDescription}>
            Unlock Joke History to browse all the jokes you've viewed, organized by date.
            Never lose track of a joke that made you laugh!
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="star" size={20} color={colors.text.inverse} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: HistorySection['data'][0] }) => {
    const isFavorite = favorites.includes(item.id);
    const time = new Date(item.viewedAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <View style={styles.jokeCard}>
        <View style={styles.jokeHeader}>
          {item.category && CATEGORY_INFO[item.category as keyof typeof CATEGORY_INFO] && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryEmoji}>
                {CATEGORY_INFO[item.category as keyof typeof CATEGORY_INFO].emoji}
              </Text>
              <Text style={styles.categoryText}>
                {CATEGORY_INFO[item.category as keyof typeof CATEGORY_INFO].label}
              </Text>
            </View>
          )}
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <Text style={styles.jokeText}>{item.joke}</Text>
        <View style={styles.jokeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item.id)}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.error : colors.text.muted}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: HistorySection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} jokes</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Joke History</Text>
        {jokeHistory.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
            accessibilityLabel="Clear history"
          >
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        )}
        {jokeHistory.length === 0 && <View style={styles.headerSpacer} />}
      </View>

      {jokeHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>
            Jokes you view will appear here so you can find them later.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{jokeHistory.length}</Text>
              <Text style={styles.statLabel}>Total Jokes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sections.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.id}-${item.viewedAt}`}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
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
  clearButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.DEFAULT,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.text.muted,
  },
  jokeCard: {
    backgroundColor: colors.surface.DEFAULT,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  jokeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  jokeText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  jokeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  actionButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  paywallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  premiumIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paywallTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  paywallDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
    marginLeft: 8,
  },
});
