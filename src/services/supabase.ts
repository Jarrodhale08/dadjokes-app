/**
 * Supabase Client - Multi-tenant Configuration
 *
 * This app uses a shared Supabase project with multi-tenant isolation.
 * All data is filtered by app_id to ensure complete separation between apps.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const APP_ID = process.env.EXPO_PUBLIC_APP_ID || 'dadjokes';

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase configuration missing. Check .env file.');
}

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Fall back to AsyncStorage for non-sensitive data
      return AsyncStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      // Fall back to AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Create Supabase client with secure storage
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Get app-specific storage bucket name
 * Each app gets its own isolated storage buckets
 */
export function getAppBucket(bucketType: 'avatars' | 'uploads'): string {
  return `${APP_ID}-${bucketType}`;
}

/**
 * Initialize app context for current user
 * Creates user_app_context record to track which apps a user has accessed
 */
export async function initializeAppContext(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert user_app_context record
    const { error } = await supabase
      .from('user_app_context')
      .upsert(
        {
          user_id: user.id,
          app_id: APP_ID,
          first_accessed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,app_id',
        }
      );

    if (error) {
      console.warn('Failed to initialize app context:', error.message);
    }
  } catch (error) {
    console.warn('Error initializing app context:', error);
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Error getting current user:', error.message);
    return null;
  }
  return user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Initialize app context after successful login
  await initializeAppContext();

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Initialize app context after successful signup
  if (data.user) {
    await initializeAppContext();
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Reset password for email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export default supabase;
