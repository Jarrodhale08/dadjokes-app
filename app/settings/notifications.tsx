import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

const TimePicker = ({ hour, minute, onChange }: TimePickerProps) => {
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const adjustHour = (delta: number) => {
    const newHour = (hour + delta + 24) % 24;
    onChange(newHour, minute);
  };

  const adjustMinute = (delta: number) => {
    let newMinute = minute + delta;
    let newHour = hour;
    if (newMinute >= 60) {
      newMinute = 0;
      newHour = (hour + 1) % 24;
    } else if (newMinute < 0) {
      newMinute = 45;
      newHour = (hour - 1 + 24) % 24;
    }
    onChange(newHour, newMinute);
  };

  return (
    <View style={styles.timePicker}>
      <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.timeButton}>
        <Ionicons name="chevron-up" size={24} color="#EF4444" />
      </TouchableOpacity>
      <Text style={styles.timeText}>{formatTime(hour, minute)}</Text>
      <TouchableOpacity onPress={() => adjustHour(1)} style={styles.timeButton}>
        <Ionicons name="chevron-down" size={24} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { userPreferences, setUserPreferences } = useAppStore();

  const [settings, setSettings] = useState({
    pushEnabled: userPreferences.notificationsEnabled,
    dailyJoke: true,
    streakReminder: true,
    newJokesAlert: false,
    weeklyDigest: true,
  });

  const [reminderTime, setReminderTime] = useState({
    hour: 9,
    minute: 0,
  });

  const toggleSetting = useCallback((key: keyof typeof settings) => {
    setSettings(prev => {
      const newValue = !prev[key];

      // Update global preferences for main notification toggle
      if (key === 'pushEnabled') {
        setUserPreferences({ notificationsEnabled: newValue });
      }

      return { ...prev, [key]: newValue };
    });
  }, [setUserPreferences]);

  const handleSave = useCallback(() => {
    Alert.alert(
      'Notifications Updated',
      'Your notification preferences have been saved.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/settings') }]
    );
  }, [router]);

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>

          <View style={styles.optionCard}>
            <View style={styles.option}>
              <View style={styles.optionIcon}>
                <Ionicons name="notifications" size={24} color="#EF4444" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Enable Notifications</Text>
                <Text style={styles.optionDescription}>Allow push notifications from Dad Jokes</Text>
              </View>
              <Switch
                value={settings.pushEnabled}
                onValueChange={() => toggleSetting('pushEnabled')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.pushEnabled ? '#EF4444' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.optionCard}>
            <View style={styles.option}>
              <View style={styles.optionIcon}>
                <Ionicons name="sunny" size={24} color="#F59E0B" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Daily Joke</Text>
                <Text style={styles.optionDescription}>Get a fresh dad joke every morning</Text>
              </View>
              <Switch
                value={settings.dailyJoke}
                onValueChange={() => toggleSetting('dailyJoke')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.dailyJoke ? '#EF4444' : '#9CA3AF'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.option}>
              <View style={styles.optionIcon}>
                <Ionicons name="flame" size={24} color="#F97316" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Streak Reminder</Text>
                <Text style={styles.optionDescription}>Don't break your joke streak!</Text>
              </View>
              <Switch
                value={settings.streakReminder}
                onValueChange={() => toggleSetting('streakReminder')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.streakReminder ? '#EF4444' : '#9CA3AF'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.option}>
              <View style={styles.optionIcon}>
                <Ionicons name="sparkles" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>New Jokes Alert</Text>
                <Text style={styles.optionDescription}>Get notified when new jokes are added</Text>
              </View>
              <Switch
                value={settings.newJokesAlert}
                onValueChange={() => toggleSetting('newJokesAlert')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.newJokesAlert ? '#EF4444' : '#9CA3AF'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.option}>
              <View style={styles.optionIcon}>
                <Ionicons name="calendar" size={24} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Weekly Digest</Text>
                <Text style={styles.optionDescription}>Top jokes of the week summary</Text>
              </View>
              <Switch
                value={settings.weeklyDigest}
                onValueChange={() => toggleSetting('weeklyDigest')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={settings.weeklyDigest ? '#EF4444' : '#9CA3AF'}
                disabled={!settings.pushEnabled}
              />
            </View>
          </View>
        </View>

        {settings.dailyJoke && settings.pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Joke Time</Text>
            <View style={styles.optionCard}>
              <View style={styles.timePickerContainer}>
                <Text style={styles.timeLabel}>Send daily joke at:</Text>
                <TimePicker
                  hour={reminderTime.hour}
                  minute={reminderTime.minute}
                  onChange={(hour, minute) => setReminderTime({ hour, minute })}
                />
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
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
    padding: 16,
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
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 68,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    minWidth: 100,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
