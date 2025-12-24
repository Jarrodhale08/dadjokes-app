/**
 * Notification Initialization Hook
 * Initializes notification service and sets up listeners
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notification.service';

export interface NotificationInitState {
  isReady: boolean;
  hasPermission: boolean;
  error: string | null;
}

export function useNotificationInit(): NotificationInitState {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let cleanup: (() => void) | null = null;

    const initNotifications = async () => {
      try {
        // Initialize notification service
        await notificationService.initialize();

        if (!isMounted) return;

        // Check if notifications are enabled
        const enabled = await notificationService.areNotificationsEnabled();
        setHasPermission(enabled);

        // Set up notification listeners
        cleanup = notificationService.setupListeners(
          // onNotificationReceived
          (notification) => {
            console.log('Notification received in foreground:', notification);
            // Handle foreground notification if needed
          },
          // onNotificationResponse
          (response) => {
            console.log('Notification tapped:', response);

            // Handle navigation based on notification data
            const data = response.notification.request.content.data;

            if (data?.screen) {
              // Navigate to the screen specified in notification data
              try {
                router.push(data.screen as any);
              } catch (err) {
                console.error('Failed to navigate from notification:', err);
              }
            } else if (data?.type === 'daily_reminder' || data?.type === 'streak_reminder') {
              // Navigate to home for reminders
              try {
                router.push('/(tabs)/');
              } catch (err) {
                console.error('Failed to navigate from notification:', err);
              }
            }
          }
        );

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('Notification initialization error:', err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
          setIsReady(false);
        }
      }
    };

    initNotifications();

    // Cleanup
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [router]);

  return { isReady, hasPermission, error };
}

export default useNotificationInit;
