/**
 * Auth Store - Supabase Authentication
 *
 * Manages user authentication state with Supabase Auth.
 * Syncs user data to cloud on login, restores from cloud on new device.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  supabase,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  resetPassword,
  getCurrentUser,
  onAuthStateChange,
} from '../services/supabase';
import {
  fetchAllUserData,
  syncLocalDataToCloud,
  fetchProfile,
  updateProfile,
} from '../services/database.service';
import { useAppStore } from './appStore';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

const mapSupabaseUser = (user: User, profile?: { display_name?: string; avatar_url?: string } | null): AuthUser => ({
  id: user.id,
  email: user.email || '',
  displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || null,
  avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const { user } = await signInWithEmail(email, password);
          if (!user) {
            throw new Error('Sign in failed');
          }

          const profile = await fetchProfile();
          const authUser = mapSupabaseUser(user, profile);

          // Fetch user data from cloud
          const cloudData = await fetchAllUserData();

          // Merge cloud data with local store
          const appStore = useAppStore.getState();

          // If cloud has data, prefer it. Otherwise, sync local to cloud.
          if (cloudData.favorites.length > 0 || cloudData.collections.length > 0) {
            // Restore from cloud
            appStore.setUser({
              id: authUser.id,
              name: authUser.displayName || '',
              email: authUser.email,
            });

            // Merge favorites
            cloudData.favorites.forEach((jokeId) => {
              if (!appStore.favorites.includes(jokeId)) {
                appStore.toggleFavorite(jokeId);
              }
            });

            // Restore streak from cloud if it's better
            if (cloudData.streak) {
              const cloudStreak = {
                currentStreak: cloudData.streak.current_streak,
                longestStreak: cloudData.streak.longest_streak,
                lastViewedDate: cloudData.streak.last_viewed_date,
                totalJokesViewed: cloudData.streak.total_jokes_viewed,
                streakBadges: cloudData.streak.streak_badges,
              };
              if (cloudStreak.longestStreak > appStore.streak.longestStreak) {
                // Cloud has better data, would need to extend appStore to set streak directly
              }
            }

            // Restore preferences from cloud
            if (cloudData.preferences) {
              appStore.setUserPreferences({
                favoriteCategories: cloudData.preferences.favorite_categories,
                notificationsEnabled: cloudData.preferences.notifications_enabled,
                autoplayEnabled: cloudData.preferences.autoplay_enabled,
                fontSize: cloudData.preferences.font_size,
              });
            }
          } else {
            // Sync local data to cloud
            await syncLocalDataToCloud({
              favorites: appStore.favorites,
              collections: appStore.collections.map((c) => ({
                name: c.name,
                emoji: c.emoji,
                jokeIds: c.jokeIds,
              })),
              streak: appStore.streak,
              preferences: appStore.userPreferences,
            });

            appStore.setUser({
              id: authUser.id,
              name: authUser.displayName || '',
              email: authUser.email,
            });
          }

          set({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null });

        try {
          const { user } = await signUpWithEmail(email, password, displayName);
          if (!user) {
            throw new Error('Sign up failed');
          }

          const authUser = mapSupabaseUser(user, { display_name: displayName });

          // Sync any local data to cloud for new user
          const appStore = useAppStore.getState();
          if (appStore.favorites.length > 0 || appStore.collections.length > 0) {
            await syncLocalDataToCloud({
              favorites: appStore.favorites,
              collections: appStore.collections.map((c) => ({
                name: c.name,
                emoji: c.emoji,
                jokeIds: c.jokeIds,
              })),
              streak: appStore.streak,
              preferences: appStore.userPreferences,
            });
          }

          appStore.setUser({
            id: authUser.id,
            name: authUser.displayName || '',
            email: authUser.email,
          });

          set({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });

        try {
          await supabaseSignOut();

          // Clear app store user
          await useAppStore.getState().logout();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign out failed',
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });

        try {
          await resetPassword(email);
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Password reset failed',
            isLoading: false,
          });
          throw error;
        }
      },

      updateUserProfile: async (updates) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await updateProfile({
            display_name: updates.displayName,
            avatar_url: updates.avatarUrl,
          });

          if (error) {
            throw new Error(error.message);
          }

          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                displayName: updates.displayName ?? user.displayName,
                avatarUrl: updates.avatarUrl ?? user.avatarUrl,
              },
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Profile update failed',
            isLoading: false,
          });
          throw error;
        }
      },

      initialize: async () => {
        try {
          const user = await getCurrentUser();
          if (user) {
            const profile = await fetchProfile();
            const authUser = mapSupabaseUser(user, profile);

            set({
              user: authUser,
              isAuthenticated: true,
              isInitialized: true,
            });

            // Update app store with user
            useAppStore.getState().setUser({
              id: authUser.id,
              name: authUser.displayName || '',
              email: authUser.email,
            });
          } else {
            set({ isInitialized: true });
          }

          // Listen for auth changes
          onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
              set({ user: null, isAuthenticated: false });
            } else if (event === 'SIGNED_IN' && session?.user) {
              const profile = await fetchProfile();
              const authUser = mapSupabaseUser(session.user, profile);
              set({ user: authUser, isAuthenticated: true });
            }
          });
        } catch (error) {
          console.warn('Auth initialization error:', error);
          set({ isInitialized: true });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'dadjokes-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        // Actual session is managed by Supabase SecureStore
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
