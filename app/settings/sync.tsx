import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function SyncScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { syncToCloud, loadFromCloud, favorites, collections, streak, userPreferences, setUserPreferences } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleSyncToCloud = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to sync your data to the cloud.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSyncing(true);
    try {
      await syncToCloud();
      setLastSyncTime(new Date().toLocaleTimeString());
      Alert.alert('Sync Complete', 'Your data has been synced to the cloud.');
    } catch (error) {
      Alert.alert('Sync Failed', 'There was an error syncing your data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, syncToCloud]);

  const handleLoadFromCloud = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to load your data from the cloud.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Load from Cloud',
      'This will merge your cloud data with your local data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            setIsSyncing(true);
            try {
              await loadFromCloud();
              setLastSyncTime(new Date().toLocaleTimeString());
              Alert.alert('Load Complete', 'Your cloud data has been loaded.');
            } catch (error) {
              Alert.alert('Load Failed', 'There was an error loading your data. Please try again.');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  }, [isAuthenticated, loadFromCloud]);

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
        <Text style={styles.headerTitle}>Data & Sync</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Sync Status Card */}
        <View style={[styles.statusCard, isAuthenticated ? styles.statusCardConnected : styles.statusCardDisconnected]}>
          <Ionicons
            name={isAuthenticated ? 'cloud-done' : 'cloud-offline'}
            size={48}
            color={isAuthenticated ? '#10B981' : '#9CA3AF'}
          />
          <Text style={styles.statusTitle}>
            {isAuthenticated ? 'Connected to Cloud' : 'Not Connected'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isAuthenticated
              ? `Signed in as ${user?.email}`
              : 'Sign in to sync your data across devices'}
          </Text>
          {lastSyncTime && (
            <Text style={styles.lastSyncText}>Last synced: {lastSyncTime}</Text>
          )}
        </View>

        {/* Data Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{favorites.length}</Text>
              <Text style={styles.dataLabel}>Favorites</Text>
            </View>
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{collections.length}</Text>
              <Text style={styles.dataLabel}>Collections</Text>
            </View>
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{streak.totalJokesViewed}</Text>
              <Text style={styles.dataLabel}>Jokes Viewed</Text>
            </View>
            <View style={styles.dataCard}>
              <Text style={styles.dataValue}>{streak.longestStreak}</Text>
              <Text style={styles.dataLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Sync Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Actions</Text>

          <TouchableOpacity
            style={[styles.actionButton, !isAuthenticated && styles.actionButtonDisabled]}
            onPress={handleSyncToCloud}
            disabled={isSyncing || !isAuthenticated}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
            )}
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Sync to Cloud</Text>
              <Text style={styles.actionDescription}>Upload your local data to the cloud</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, !isAuthenticated && styles.actionButtonDisabled]}
            onPress={handleLoadFromCloud}
            disabled={isSyncing || !isAuthenticated}
          >
            {isSyncing ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Ionicons name="cloud-download" size={24} color="#EF4444" />
            )}
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.actionTitleSecondary]}>Load from Cloud</Text>
              <Text style={styles.actionDescription}>Download your cloud data to this device</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>

          <View style={styles.option}>
            <Ionicons name="notifications" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Auto Sync</Text>
              <Text style={styles.optionDescription}>Sync data when app opens</Text>
            </View>
            <Switch
              value={userPreferences.autoplayEnabled}
              onValueChange={(value) => setUserPreferences({ autoplayEnabled: value })}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={userPreferences.autoplayEnabled ? '#EF4444' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366F1" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Sync</Text>
            <Text style={styles.infoText}>
              Your favorites, collections, and streak data are stored in the cloud when you sign in.
              This allows you to access your jokes across all your devices.
            </Text>
          </View>
        </View>

        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/auth/login' as any)}
          >
            <Ionicons name="log-in" size={20} color="#FFFFFF" />
            <Text style={styles.signInButtonText}>Sign In to Enable Sync</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusCardConnected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  statusCardDisconnected: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dataCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dataValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
  },
  dataLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionTitleSecondary: {
    color: '#EF4444',
  },
  actionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    minHeight: 72,
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  infoText: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 4,
    lineHeight: 18,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
