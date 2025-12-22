import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { colors } from '../../src/theme/colors';

const STREAK_MILESTONES = [
  { days: 3, badge: '🔥', name: 'On Fire', description: '3 day streak' },
  { days: 7, badge: '⭐', name: 'Week Warrior', description: '7 day streak' },
  { days: 14, badge: '🏆', name: 'Joke Champion', description: '14 day streak' },
  { days: 30, badge: '👑', name: 'Dad Joke King', description: '30 day streak' },
  { days: 100, badge: '🎯', name: 'Century Club', description: '100 day streak' },
];

export default function StreakScreen() {
  const router = useRouter();
  const { streak, getStreakStatus } = useAppStore();
  const { isActive, needsJokeToday } = getStreakStatus();

  const getStreakMessage = () => {
    if (streak.currentStreak === 0) {
      return "Start your streak by viewing a joke today!";
    }
    if (needsJokeToday) {
      return "View a joke today to keep your streak going!";
    }
    return "Great job! You've viewed a joke today.";
  };

  const getNextMilestone = () => {
    for (const milestone of STREAK_MILESTONES) {
      if (streak.currentStreak < milestone.days) {
        return milestone;
      }
    }
    return null;
  };

  const nextMilestone = getNextMilestone();
  const progress = nextMilestone
    ? (streak.currentStreak / nextMilestone.days) * 100
    : 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Streak</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Current Streak Card */}
        <View style={[styles.streakCard, needsJokeToday && styles.streakCardWarning]}>
          <Text style={styles.streakEmoji}>
            {streak.currentStreak >= 7 ? '🔥' : streak.currentStreak >= 3 ? '⭐' : '😊'}
          </Text>
          <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
          <Text style={styles.streakLabel}>
            day{streak.currentStreak !== 1 ? 's' : ''} streak
          </Text>
          <Text style={[styles.streakMessage, needsJokeToday && styles.streakMessageWarning]}>
            {getStreakMessage()}
          </Text>

          {needsJokeToday && (
            <TouchableOpacity
              style={styles.viewJokeButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Ionicons name="happy" size={20} color="#FFFFFF" />
              <Text style={styles.viewJokeButtonText}>View a Joke</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak.totalJokesViewed}</Text>
            <Text style={styles.statLabel}>Jokes Viewed</Text>
          </View>
        </View>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Milestone</Text>
            <View style={styles.milestoneProgress}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneBadge}>{nextMilestone.badge}</Text>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneName}>{nextMilestone.name}</Text>
                  <Text style={styles.milestoneDescription}>
                    {nextMilestone.days - streak.currentStreak} more day
                    {nextMilestone.days - streak.currentStreak !== 1 ? 's' : ''} to go
                  </Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {streak.currentStreak} / {nextMilestone.days} days
              </Text>
            </View>
          </View>
        )}

        {/* Badges Earned */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges Earned</Text>
          <View style={styles.badgesGrid}>
            {STREAK_MILESTONES.map((milestone) => {
              const earned = streak.streakBadges.includes(milestone.badge);
              return (
                <View
                  key={milestone.days}
                  style={[styles.badgeCard, !earned && styles.badgeCardLocked]}
                >
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                    {earned ? milestone.badge : '🔒'}
                  </Text>
                  <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                    {milestone.name}
                  </Text>
                  <Text style={styles.badgeRequirement}>{milestone.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Tips</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipRow}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                View at least one joke each day to maintain your streak
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipEmoji}>⏰</Text>
              <Text style={styles.tipText}>
                Enable daily joke notifications to never miss a day
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipEmoji}>🎯</Text>
              <Text style={styles.tipText}>
                Streaks reset at midnight in your local timezone
              </Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
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
    padding: 16,
    paddingBottom: 32,
  },
  streakCard: {
    backgroundColor: colors.primary.muted,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.DEFAULT,
  },
  streakCardWarning: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  streakEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.primary.dark,
  },
  streakLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.mustache,
    marginTop: -8,
  },
  streakMessage: {
    fontSize: 16,
    color: colors.primary.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  streakMessageWarning: {
    color: colors.error,
    fontWeight: '600',
  },
  viewJokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  viewJokeButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary.DEFAULT,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  milestoneProgress: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneBadge: {
    fontSize: 40,
    marginRight: 16,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  milestoneDescription: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.surface.elevated,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  badgeCardLocked: {
    backgroundColor: '#F3F4F6',
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeEmojiLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeRequirement: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
