import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as DatabaseService from '../services/database.service';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Joke {
  id: string;
  setup: string;
  punchline: string;
  category: string;
  rating: number;
  isFavorite: boolean;
  shareCount: number;
  createdAt: string;
}

interface UserPreferences {
  favoriteCategories: string[];
  notificationsEnabled: boolean;
  autoplayEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastViewedDate: string | null;
  totalJokesViewed: number;
  streakBadges: string[];
}

interface JokeCollection {
  id: string;
  name: string;
  emoji: string;
  jokeIds: string[];
  createdAt: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  jokes: Joke[];
  favorites: string[];
  userPreferences: UserPreferences;
  streak: StreakData;
  collections: JokeCollection[];
  loading: boolean;
  error: string | null;

  setUser: (user: User | null) => Promise<void>;
  setJokes: (jokes: Joke[]) => void;
  addJoke: (joke: Joke) => void;
  updateJoke: (id: string, updates: Partial<Joke>) => void;
  deleteJoke: (id: string) => void;
  toggleFavorite: (jokeId: string) => void;
  incrementShareCount: (jokeId: string) => void;
  setUserPreferences: (preferences: Partial<UserPreferences>) => void;

  // Streak actions
  recordJokeView: () => void;
  getStreakStatus: () => { isActive: boolean; needsJokeToday: boolean };

  // Collection actions
  createCollection: (name: string, emoji: string) => string;
  addToCollection: (collectionId: string, jokeId: string) => void;
  removeFromCollection: (collectionId: string, jokeId: string) => void;
  deleteCollection: (collectionId: string) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  reset: () => void;

  // Sync actions
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

const saveToSecureStore = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key} to SecureStore:`, error);
  }
};

const loadFromSecureStore = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`Failed to load ${key} from SecureStore:`, error);
    return null;
  }
};

const deleteFromSecureStore = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`Failed to delete ${key} from SecureStore:`, error);
  }
};

const STREAK_BADGES = [
  { days: 3, badge: '🔥', name: 'On Fire' },
  { days: 7, badge: '⭐', name: 'Week Warrior' },
  { days: 14, badge: '🏆', name: 'Joke Champion' },
  { days: 30, badge: '👑', name: 'Dad Joke King' },
  { days: 100, badge: '🎯', name: 'Century Club' },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialState = {
  isAuthenticated: false,
  user: null,
  jokes: [],
  favorites: [],
  userPreferences: {
    favoriteCategories: [],
    notificationsEnabled: true,
    autoplayEnabled: false,
    fontSize: 'medium' as const,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastViewedDate: null,
    totalJokesViewed: 0,
    streakBadges: [],
  } as StreakData,
  collections: [] as JokeCollection[],
  loading: false,
  error: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: async (user) => {
        if (user) {
          await saveToSecureStore('user_data', JSON.stringify(user));
        } else {
          await deleteFromSecureStore('user_data');
        }
        set({ user, isAuthenticated: !!user });
      },

      setJokes: (jokes) => set({ jokes }),

      addJoke: (joke) => set((state) => ({ 
        jokes: [...state.jokes, joke] 
      })),

      updateJoke: (id, updates) => set((state) => ({
        jokes: state.jokes.map((joke) =>
          joke.id === id ? { ...joke, ...updates } : joke
        ),
      })),

      deleteJoke: (id) => set((state) => ({
        jokes: state.jokes.filter((joke) => joke.id !== id),
        favorites: state.favorites.filter((favId) => favId !== id),
      })),

      toggleFavorite: (jokeId) => set((state) => {
        const isFavorite = state.favorites.includes(jokeId);
        return {
          favorites: isFavorite
            ? state.favorites.filter((id) => id !== jokeId)
            : [...state.favorites, jokeId],
          jokes: state.jokes.map((joke) =>
            joke.id === jokeId ? { ...joke, isFavorite: !isFavorite } : joke
          ),
        };
      }),

      incrementShareCount: (jokeId) => set((state) => ({
        jokes: state.jokes.map((joke) =>
          joke.id === jokeId
            ? { ...joke, shareCount: joke.shareCount + 1 }
            : joke
        ),
      })),

      setUserPreferences: (preferences) => set((state) => ({
        userPreferences: { ...state.userPreferences, ...preferences },
      })),

      recordJokeView: () => set((state) => {
        const today = getTodayDate();
        const { streak } = state;

        // If already viewed today, just increment total
        if (streak.lastViewedDate === today) {
          return {
            streak: {
              ...streak,
              totalJokesViewed: streak.totalJokesViewed + 1,
            },
          };
        }

        // Check if this continues the streak (viewed yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (streak.lastViewedDate === yesterdayStr) {
          newStreak = streak.currentStreak + 1;
        }

        // Check for new badges
        const newBadges = [...streak.streakBadges];
        for (const { days, badge } of STREAK_BADGES) {
          if (newStreak >= days && !newBadges.includes(badge)) {
            newBadges.push(badge);
          }
        }

        return {
          streak: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastViewedDate: today,
            totalJokesViewed: streak.totalJokesViewed + 1,
            streakBadges: newBadges,
          },
        };
      }),

      getStreakStatus: () => {
        const { streak } = get();
        const today = getTodayDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const viewedToday = streak.lastViewedDate === today;
        const viewedYesterday = streak.lastViewedDate === yesterdayStr;

        return {
          isActive: viewedToday || viewedYesterday,
          needsJokeToday: !viewedToday,
        };
      },

      createCollection: (name, emoji) => {
        const id = `collection_${Date.now()}`;
        set((state) => ({
          collections: [
            ...state.collections,
            {
              id,
              name,
              emoji,
              jokeIds: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      addToCollection: (collectionId, jokeId) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId && !c.jokeIds.includes(jokeId)
            ? { ...c, jokeIds: [...c.jokeIds, jokeId] }
            : c
        ),
      })),

      removeFromCollection: (collectionId, jokeId) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId
            ? { ...c, jokeIds: c.jokeIds.filter((id) => id !== jokeId) }
            : c
        ),
      })),

      deleteCollection: (collectionId) => set((state) => ({
        collections: state.collections.filter((c) => c.id !== collectionId),
      })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      logout: async () => {
        await deleteFromSecureStore('auth_token');
        await deleteFromSecureStore('user_data');
        set(initialState);
      },

      restoreSession: async () => {
        const token = await loadFromSecureStore('auth_token');
        const userData = await loadFromSecureStore('user_data');
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            set({ user, isAuthenticated: true });
          } catch (error) {
            console.warn('Failed to parse user data:', error);
            await deleteFromSecureStore('user_data');
          }
        }
      },

      reset: () => set(initialState),

      syncToCloud: async () => {
        const state = get();
        if (!state.isAuthenticated || !state.user) return;

        try {
          // Sync streak
          await DatabaseService.upsertStreak({
            current_streak: state.streak.currentStreak,
            longest_streak: state.streak.longestStreak,
            last_viewed_date: state.streak.lastViewedDate,
            total_jokes_viewed: state.streak.totalJokesViewed,
            streak_badges: state.streak.streakBadges,
          });

          // Sync preferences
          await DatabaseService.upsertUserPreferences({
            favorite_categories: state.userPreferences.favoriteCategories,
            notifications_enabled: state.userPreferences.notificationsEnabled,
            autoplay_enabled: state.userPreferences.autoplayEnabled,
            font_size: state.userPreferences.fontSize,
          });

          console.log('Data synced to cloud successfully');
        } catch (error) {
          console.warn('Failed to sync to cloud:', error);
        }
      },

      loadFromCloud: async () => {
        const state = get();
        if (!state.isAuthenticated) return;

        try {
          const cloudData = await DatabaseService.fetchAllUserData();

          // Merge cloud data with local
          if (cloudData.streak) {
            set({
              streak: {
                currentStreak: cloudData.streak.current_streak,
                longestStreak: Math.max(
                  cloudData.streak.longest_streak,
                  state.streak.longestStreak
                ),
                lastViewedDate: cloudData.streak.last_viewed_date,
                totalJokesViewed: Math.max(
                  cloudData.streak.total_jokes_viewed,
                  state.streak.totalJokesViewed
                ),
                streakBadges: [
                  ...new Set([
                    ...state.streak.streakBadges,
                    ...cloudData.streak.streak_badges,
                  ]),
                ],
              },
            });
          }

          if (cloudData.preferences) {
            set({
              userPreferences: {
                favoriteCategories: cloudData.preferences.favorite_categories,
                notificationsEnabled: cloudData.preferences.notifications_enabled,
                autoplayEnabled: cloudData.preferences.autoplay_enabled,
                fontSize: cloudData.preferences.font_size,
              },
            });
          }

          // Merge favorites
          if (cloudData.favorites.length > 0) {
            const mergedFavorites = [
              ...new Set([...state.favorites, ...cloudData.favorites]),
            ];
            set({ favorites: mergedFavorites });
          }

          // Merge collections (by name to avoid duplicates)
          if (cloudData.collections.length > 0) {
            const existingNames = state.collections.map((c) => c.name);
            const newCollections = cloudData.collections
              .filter((c) => !existingNames.includes(c.name))
              .map((c) => ({
                id: c.id,
                name: c.name,
                emoji: c.emoji,
                jokeIds: c.joke_ids,
                createdAt: c.created_at,
              }));
            if (newCollections.length > 0) {
              set({
                collections: [...state.collections, ...newCollections],
              });
            }
          }

          console.log('Data loaded from cloud successfully');
        } catch (error) {
          console.warn('Failed to load from cloud:', error);
        }
      },
    }),
    {
      name: 'dadjokes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        jokes: state.jokes,
        favorites: state.favorites,
        userPreferences: state.userPreferences,
        streak: state.streak,
        collections: state.collections,
      }),
    }
  )
);

export default useAppStore;
