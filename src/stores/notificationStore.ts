/**
 * Notification Store
 * Manages notification settings and preferences with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService, { NotificationSettings } from '../services/notification.service';

export interface NotificationState extends NotificationSettings {
  isLoading: boolean;
  error: string | null;

  // Actions
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  togglePush: () => Promise<void>;
  toggleDailyReminder: () => Promise<void>;
  toggleStreakReminder: () => Promise<void>;
  toggleNewContentAlerts: () => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
  setReminderDays: (days: number[]) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  loadSettings: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  dailyJokeReminder: true,
  reminderTime: { hour: 9, minute: 0 },
  reminderDays: [1, 2, 3, 4, 5, 6, 7], // All days of the week
  streakReminder: true,
  newContentAlerts: true,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      isLoading: false,
      error: null,

      updateSettings: async (settings: Partial<NotificationSettings>) => {
        set({ isLoading: true, error: null });

        try {
          // Save to notification service
          await notificationService.saveSettings(settings);

          // Update store
          set((state) => ({
            ...state,
            ...settings,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update settings',
            isLoading: false,
          });
          throw error;
        }
      },

      togglePush: async () => {
        const { pushEnabled, updateSettings } = get();
        await updateSettings({ pushEnabled: !pushEnabled });
      },

      toggleDailyReminder: async () => {
        const { dailyJokeReminder, updateSettings } = get();
        await updateSettings({ dailyJokeReminder: !dailyJokeReminder });
      },

      toggleStreakReminder: async () => {
        const { streakReminder, updateSettings } = get();
        await updateSettings({ streakReminder: !streakReminder });
      },

      toggleNewContentAlerts: async () => {
        const { newContentAlerts, updateSettings } = get();
        await updateSettings({ newContentAlerts: !newContentAlerts });
      },

      setReminderTime: async (hour: number, minute: number) => {
        await get().updateSettings({ reminderTime: { hour, minute } });
      },

      setReminderDays: async (days: number[]) => {
        await get().updateSettings({ reminderDays: days });
      },

      requestPermissions: async () => {
        set({ isLoading: true, error: null });

        try {
          const granted = await notificationService.requestPermissions();

          set({
            pushEnabled: granted,
            isLoading: false,
          });

          return granted;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to request permissions',
            isLoading: false,
          });
          return false;
        }
      },

      loadSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const settings = await notificationService.getSettings();

          set({
            ...settings,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load settings',
            isLoading: false,
          });
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'dadjokes-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pushEnabled: state.pushEnabled,
        dailyJokeReminder: state.dailyJokeReminder,
        reminderTime: state.reminderTime,
        reminderDays: state.reminderDays,
        streakReminder: state.streakReminder,
        newContentAlerts: state.newContentAlerts,
      }),
    }
  )
);

export default useNotificationStore;
