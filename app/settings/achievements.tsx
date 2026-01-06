/**
 * Achievements Screen (Premium Feature)
 * Shows all achievements with progress tracking and unlock status
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAppStore } from '../../src/stores/appStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { colors } from '../../src/theme/colors';

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
    progress: number;
    target: number;
  };
  index: number;
}

function AchievementCard({ achievement, index }: AchievementCardProps) {
  const isUnlocked = achievement.unlockedAt !== null;
  const progressPercent = Math.min((achievement.progress / achievement.target) * 100, 100);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(progressPercent, {
      damping: 15,
      stiffness: 100,
    });
  }, [progressPercent, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const unlockedDate = achievement.unlockedAt
    ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.achievementCard, isUnlocked && styles.achievementCardUnlocked]}
    >
      <View style={[styles.iconContainer, isUnlocked && styles.iconContainerUnlocked]}>
        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
        {isUnlocked && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.achievementContent}>
        <View style={styles.achievementHeader}>
          <Text style={[styles.achievementName, isUnlocked && styles.achievementNameUnlocked]}>
            {achievement.name}
          </Text>
          {isUnlocked && (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedBadgeText}>Unlocked</Text>
            </View>
          )}
        </View>

        <Text style={styles.achievementDescription}>{achievement.description}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                isUnlocked && styles.progressFillUnlocked,
                progressStyle,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.target}
          </Text>
        </View>

        {unlockedDate && (
          <Text style={styles.unlockedDate}>Achieved on {unlockedDate}</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, checkAchievements, getUnlockedAchievements, getLockedAchievements } =
    useAppStore();
  const { isPremium } = useSubscriptionStore();
  const premium = isPremium();

  // Check achievements on mount
  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), [achievements]);
  const lockedAchievements = useMemo(() => getLockedAchievements(), [achievements]);

  const totalPoints = unlockedAchievements.length * 10;
  const maxPoints = achievements.length * 10;

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
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.paywallContainer}>
          <View style={styles.premiumIcon}>
            <Ionicons name="trophy" size={64} color={colors.warning} />
          </View>
          <Text style={styles.paywallTitle}>Premium Feature</Text>
          <Text style={styles.paywallDescription}>
            Unlock Achievements to track your progress and earn badges as you explore dad jokes.
            {'\n\n'}
            {achievements.length} achievements waiting to be discovered!
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
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{lockedAchievements.length}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressLabel}>Overall Progress</Text>
            <Text style={styles.overallProgressPercent}>
              {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
            </Text>
          </View>
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${(unlockedAchievements.length / achievements.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} /> Unlocked
            </Text>
            {unlockedAchievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index}
              />
            ))}
          </>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Ionicons name="lock-closed" size={16} color={colors.text.muted} /> In Progress
            </Text>
            {lockedAchievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={index + unlockedAchievements.length}
              />
            ))}
          </>
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
    padding: 16,
    paddingBottom: 32,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.DEFAULT,
    marginHorizontal: 16,
  },
  overallProgress: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  overallProgressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: colors.border.DEFAULT,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  achievementCardUnlocked: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '40',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerUnlocked: {
    backgroundColor: colors.warning + '20',
  },
  achievementIcon: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface.DEFAULT,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  achievementNameUnlocked: {
    color: colors.success,
  },
  unlockedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  unlockedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievementDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border.DEFAULT,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 3,
  },
  progressFillUnlocked: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    minWidth: 45,
    textAlign: 'right',
  },
  unlockedDate: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 8,
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
    backgroundColor: colors.warning + '20',
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
