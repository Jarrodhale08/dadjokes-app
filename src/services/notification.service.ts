/**
 * Notification Service
 * Handles push notifications and local reminders using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@dadjokes_notification_settings';
const PUSH_TOKEN_KEY = '@dadjokes_push_token';

export interface NotificationSettings {
  pushEnabled: boolean;
  dailyJokeReminder: boolean;
  reminderTime: { hour: number; minute: number };
  reminderDays: number[]; // 1 = Monday, 7 = Sunday
  streakReminder: boolean;
  newContentAlerts: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  dailyJokeReminder: true,
  reminderTime: { hour: 9, minute: 0 },
  reminderDays: [1, 2, 3, 4, 5, 6, 7], // All days
  streakReminder: true,
  newContentAlerts: true,
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize the notification service
   */
  async initialize(): Promise<void> {
    try {
      // Set up Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();

      if (hasPermission) {
        // Register for push notifications
        await this.registerForPushNotifications();

        // Schedule any configured reminders
        const settings = await this.getSettings();
        if (settings.dailyJokeReminder) {
          await this.scheduleDailyReminder(settings);
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Set up Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Reminders',
      description: 'Your daily dad joke reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
    });

    await Notifications.setNotificationChannelAsync('streaks', {
      name: 'Streak Alerts',
      description: "Don't lose your joke viewing streak!",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      // Push notifications require a physical device
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('No project ID found for push notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);

      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Get stored push token
   */
  async getPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      this.expoPushToken = token;
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));

      // Update scheduled notifications based on new settings
      if (updated.dailyJokeReminder) {
        await this.scheduleDailyReminder(updated);
      } else {
        await this.cancelDailyReminder();
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Schedule daily joke reminder
   */
  async scheduleDailyReminder(settings: NotificationSettings): Promise<void> {
    try {
      // Cancel existing reminders first
      await this.cancelDailyReminder();

      const { hour, minute } = settings.reminderTime;

      // Schedule for each enabled day
      for (const day of settings.reminderDays) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '😂 Time for a Dad Joke!',
            body: 'Your daily dose of humor is waiting for you.',
            data: { type: 'daily_reminder', screen: '/(tabs)' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day,
            hour,
            minute,
          },
          identifier: `daily_reminder_${day}`,
        });
      }

      // Daily reminders scheduled successfully
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  /**
   * Cancel daily reminders
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const reminderIds = scheduled
        .filter(n => n.identifier.startsWith('daily_reminder_'))
        .map(n => n.identifier);

      for (const id of reminderIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch (error) {
      console.error('Failed to cancel daily reminders:', error);
    }
  }

  /**
   * Send streak reminder notification
   */
  async sendStreakReminder(currentStreak: number): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.streakReminder) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔥 ${currentStreak} Day Streak at Risk!`,
          body: "Don't forget to check today's dad joke to keep your streak alive!",
          data: { type: 'streak_reminder', screen: '/(tabs)' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1, // Immediate
        },
      });
    } catch (error) {
      console.error('Failed to send streak reminder:', error);
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        onNotificationReceived?.(notification);
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        onNotificationResponse?.(response);
      }
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
