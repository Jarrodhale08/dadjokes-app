/**
 * Database Service - Multi-tenant CRUD Operations
 *
 * All operations automatically filter by app_id for tenant isolation.
 * Use { skipAppFilter: true } for shared tables like 'profiles'.
 */

import { supabase, APP_ID, getCurrentUser } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface QueryOptions {
  skipAppFilter?: boolean;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface MutationResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

// ============================================================================
// JOKES
// ============================================================================

export interface JokeRecord {
  id: string;
  app_id: string;
  user_id: string;
  setup: string;
  punchline: string;
  category: string;
  rating: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}

export async function fetchJokes(options: QueryOptions = {}): Promise<JokeRecord[]> {
  let query = supabase.from('jokes').select('*');

  if (!options.skipAppFilter && APP_ID) {
    query = query.eq('app_id', APP_ID);
  }

  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jokes:', error.message);
    return [];
  }

  return data || [];
}

export async function createJoke(
  joke: Omit<JokeRecord, 'id' | 'app_id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<MutationResult<JokeRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('jokes')
    .insert({
      ...joke,
      app_id: APP_ID,
      user_id: user.id,
    })
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// FAVORITES
// ============================================================================

export interface FavoriteRecord {
  id: string;
  app_id: string;
  user_id: string;
  joke_id: string;
  created_at: string;
}

export async function fetchFavorites(): Promise<FavoriteRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching favorites:', error.message);
    return [];
  }

  return data || [];
}

export async function addFavorite(jokeId: string): Promise<MutationResult<FavoriteRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      app_id: APP_ID,
      user_id: user.id,
      joke_id: jokeId,
    })
    .select()
    .single();

  return { data, error };
}

export async function removeFavorite(jokeId: string): Promise<{ error: PostgrestError | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('app_id', APP_ID)
    .eq('user_id', user.id)
    .eq('joke_id', jokeId);

  return { error };
}

// ============================================================================
// COLLECTIONS
// ============================================================================

export interface CollectionRecord {
  id: string;
  app_id: string;
  user_id: string;
  name: string;
  emoji: string;
  joke_ids: string[];
  created_at: string;
  updated_at: string;
}

export async function fetchCollections(): Promise<CollectionRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error.message);
    return [];
  }

  return data || [];
}

export async function createCollection(
  name: string,
  emoji: string
): Promise<MutationResult<CollectionRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('user_collections')
    .insert({
      app_id: APP_ID,
      user_id: user.id,
      name,
      emoji,
      joke_ids: [],
    })
    .select()
    .single();

  return { data, error };
}

export async function updateCollection(
  id: string,
  updates: Partial<Pick<CollectionRecord, 'name' | 'emoji' | 'joke_ids'>>
): Promise<MutationResult<CollectionRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('user_collections')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('app_id', APP_ID)
    .eq('user_id', user.id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCollection(id: string): Promise<{ error: PostgrestError | null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { error } = await supabase
    .from('user_collections')
    .delete()
    .eq('id', id)
    .eq('app_id', APP_ID)
    .eq('user_id', user.id);

  return { error };
}

// ============================================================================
// STREAK DATA
// ============================================================================

export interface StreakRecord {
  id: string;
  app_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_viewed_date: string | null;
  total_jokes_viewed: number;
  streak_badges: string[];
  created_at: string;
  updated_at: string;
}

export async function fetchStreak(): Promise<StreakRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching streak:', error.message);
  }

  return data;
}

export async function upsertStreak(
  streak: Omit<StreakRecord, 'id' | 'app_id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<MutationResult<StreakRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('user_streaks')
    .upsert(
      {
        app_id: APP_ID,
        user_id: user.id,
        ...streak,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'app_id,user_id',
      }
    )
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferencesRecord {
  id: string;
  app_id: string;
  user_id: string;
  favorite_categories: string[];
  notifications_enabled: boolean;
  autoplay_enabled: boolean;
  font_size: 'small' | 'medium' | 'large';
  created_at: string;
  updated_at: string;
}

export async function fetchUserPreferences(): Promise<UserPreferencesRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('app_id', APP_ID)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error.message);
  }

  return data;
}

export async function upsertUserPreferences(
  prefs: Partial<
    Omit<UserPreferencesRecord, 'id' | 'app_id' | 'user_id' | 'created_at' | 'updated_at'>
  >
): Promise<MutationResult<UserPreferencesRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        app_id: APP_ID,
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'app_id,user_id',
      }
    )
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// PROFILES (Shared table - no app_id filter)
// ============================================================================

export interface ProfileRecord {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchProfile(): Promise<ProfileRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error.message);
  }

  return data;
}

export async function updateProfile(
  updates: Partial<Pick<ProfileRecord, 'display_name' | 'avatar_url'>>
): Promise<MutationResult<ProfileRecord>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Not authenticated' } as PostgrestError };
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// SYNC UTILITIES
// ============================================================================

/**
 * Sync local data to Supabase
 * Used when user logs in to migrate local-only data to cloud
 */
export async function syncLocalDataToCloud(localData: {
  favorites: string[];
  collections: Array<{ name: string; emoji: string; jokeIds: string[] }>;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastViewedDate: string | null;
    totalJokesViewed: number;
    streakBadges: string[];
  };
  preferences: {
    favoriteCategories: string[];
    notificationsEnabled: boolean;
    autoplayEnabled: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: ['Not authenticated'] };
  }

  // Sync favorites
  for (const jokeId of localData.favorites) {
    const { error } = await addFavorite(jokeId);
    if (error && !error.message?.includes('duplicate')) {
      errors.push(`Failed to sync favorite ${jokeId}: ${error.message}`);
    }
  }

  // Sync collections
  for (const collection of localData.collections) {
    const { data, error } = await createCollection(collection.name, collection.emoji);
    if (error) {
      errors.push(`Failed to create collection ${collection.name}: ${error.message}`);
    } else if (data && collection.jokeIds.length > 0) {
      await updateCollection(data.id, { joke_ids: collection.jokeIds });
    }
  }

  // Sync streak
  const { error: streakError } = await upsertStreak({
    current_streak: localData.streak.currentStreak,
    longest_streak: localData.streak.longestStreak,
    last_viewed_date: localData.streak.lastViewedDate,
    total_jokes_viewed: localData.streak.totalJokesViewed,
    streak_badges: localData.streak.streakBadges,
  });
  if (streakError) {
    errors.push(`Failed to sync streak: ${streakError.message}`);
  }

  // Sync preferences
  const { error: prefsError } = await upsertUserPreferences({
    favorite_categories: localData.preferences.favoriteCategories,
    notifications_enabled: localData.preferences.notificationsEnabled,
    autoplay_enabled: localData.preferences.autoplayEnabled,
    font_size: localData.preferences.fontSize,
  });
  if (prefsError) {
    errors.push(`Failed to sync preferences: ${prefsError.message}`);
  }

  return { success: errors.length === 0, errors };
}

/**
 * Fetch all user data from cloud
 * Used to restore data when user logs in on a new device
 */
export async function fetchAllUserData(): Promise<{
  favorites: string[];
  collections: CollectionRecord[];
  streak: StreakRecord | null;
  preferences: UserPreferencesRecord | null;
  profile: ProfileRecord | null;
}> {
  const [favorites, collections, streak, preferences, profile] = await Promise.all([
    fetchFavorites(),
    fetchCollections(),
    fetchStreak(),
    fetchUserPreferences(),
    fetchProfile(),
  ]);

  return {
    favorites: favorites.map((f) => f.joke_id),
    collections,
    streak,
    preferences,
    profile,
  };
}

export default {
  // Jokes
  fetchJokes,
  createJoke,
  // Favorites
  fetchFavorites,
  addFavorite,
  removeFavorite,
  // Collections
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  // Streak
  fetchStreak,
  upsertStreak,
  // Preferences
  fetchUserPreferences,
  upsertUserPreferences,
  // Profile
  fetchProfile,
  updateProfile,
  // Sync
  syncLocalDataToCloud,
  fetchAllUserData,
};
