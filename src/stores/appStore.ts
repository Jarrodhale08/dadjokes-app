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

interface JokeHistoryEntry {
  id: string;
  joke: string;
  category?: string;
  viewedAt: string;
  date: string; // YYYY-MM-DD
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label: string;
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
  jokeHistory: JokeHistoryEntry[];
  achievements: Achievement[];
  customReminders: ReminderTime[];
  totalShareCount: number;
  categoriesExplored: string[];
  loading: boolean;
  error: string | null;

  setUser: (user: User | null) => Promise<void>;
  setJokes: (jokes: Joke[]) => void;
  addJoke: (joke: Joke) => void;
  updateJoke: (id: string, updates: Partial<Joke>) => void;
  deleteJoke: (id: string) => void;
  toggleFavorite: (jokeId: string) => void;
  incrementShareCount: (jokeId: string) => void;
  updateJokeRating: (jokeId: string, rating: number) => void;
  setUserPreferences: (preferences: Partial<UserPreferences>) => void;

  // Streak actions
  recordJokeView: () => void;
  getStreakStatus: () => { isActive: boolean; needsJokeToday: boolean };

  // Collection actions
  createCollection: (name: string, emoji: string) => string;
  addToCollection: (collectionId: string, jokeId: string) => void;
  removeFromCollection: (collectionId: string, jokeId: string) => void;
  deleteCollection: (collectionId: string) => void;

  // Joke History actions (Premium)
  addToHistory: (joke: { id: string; joke: string; category?: string }) => void;
  getHistoryByDate: (date: string) => JokeHistoryEntry[];
  clearHistory: () => void;

  // Achievement actions (Premium)
  checkAchievements: () => void;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];

  // Custom Reminders actions (Premium)
  addReminder: (hour: number, minute: number, label: string) => string;
  updateReminder: (id: string, updates: Partial<ReminderTime>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;

  // Category tracking
  trackCategoryExplored: (category: string) => void;

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

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Viewing achievements
  { id: 'first_joke', name: 'First Laugh', description: 'View your first dad joke', icon: '😄', target: 1 },
  { id: 'jokes_10', name: 'Getting Started', description: 'View 10 dad jokes', icon: '📖', target: 10 },
  { id: 'jokes_50', name: 'Joke Enthusiast', description: 'View 50 dad jokes', icon: '📚', target: 50 },
  { id: 'jokes_100', name: 'Joke Master', description: 'View 100 dad jokes', icon: '🎓', target: 100 },
  { id: 'jokes_500', name: 'Joke Legend', description: 'View 500 dad jokes', icon: '👑', target: 500 },
  { id: 'jokes_1000', name: 'Dad Joke Deity', description: 'View 1000 dad jokes', icon: '🏆', target: 1000 },
  // Sharing achievements
  { id: 'first_share', name: 'Spreading Joy', description: 'Share your first joke', icon: '📤', target: 1 },
  { id: 'shares_10', name: 'Social Butterfly', description: 'Share 10 jokes with friends', icon: '🦋', target: 10 },
  { id: 'shares_50', name: 'Joke Ambassador', description: 'Share 50 jokes with the world', icon: '🌍', target: 50 },
  { id: 'shares_100', name: 'Viral Dad', description: 'Share 100 jokes - you are unstoppable!', icon: '🚀', target: 100 },
  // Favorites achievements
  { id: 'first_fav', name: 'Collector', description: 'Save your first favorite joke', icon: '❤️', target: 1 },
  { id: 'favs_10', name: 'Joke Hoarder', description: 'Save 10 favorite jokes', icon: '💕', target: 10 },
  { id: 'favs_25', name: 'Joke Curator', description: 'Save 25 favorite jokes', icon: '🎨', target: 25 },
  { id: 'favs_50', name: 'Joke Librarian', description: 'Save 50 favorite jokes', icon: '📕', target: 50 },
  // Category achievements
  { id: 'cat_explorer', name: 'Category Explorer', description: 'Explore 3 different categories', icon: '🧭', target: 3 },
  { id: 'cat_master', name: 'Category Master', description: 'Explore all 12 joke categories', icon: '🗺️', target: 12 },
  // Collection achievements
  { id: 'first_collection', name: 'Organized', description: 'Create your first collection', icon: '📁', target: 1 },
  { id: 'collections_5', name: 'Super Organized', description: 'Create 5 joke collections', icon: '🗂️', target: 5 },
  // Streak achievements (mirror of STREAK_BADGES)
  { id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', target: 3 },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⭐', target: 7 },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '📅', target: 30 },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Initialize achievements with progress tracking
const initializeAchievements = (): Achievement[] =>
  ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlockedAt: null,
    progress: 0,
  }));

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
  jokeHistory: [] as JokeHistoryEntry[],
  achievements: initializeAchievements(),
  customReminders: [] as ReminderTime[],
  totalShareCount: 0,
  categoriesExplored: [] as string[],
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
        totalShareCount: state.totalShareCount + 1,
      })),

      updateJokeRating: (jokeId, rating) => set((state) => ({
        jokes: state.jokes.map((joke) =>
          joke.id === jokeId ? { ...joke, rating } : joke
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

      // Joke History actions (Premium)
      addToHistory: (joke) => set((state) => {
        const today = getTodayDate();
        const now = new Date().toISOString();

        // Check if joke already exists in today's history
        const alreadyInToday = state.jokeHistory.some(
          (h) => h.id === joke.id && h.date === today
        );

        if (alreadyInToday) return state;

        const entry: JokeHistoryEntry = {
          id: joke.id,
          joke: joke.joke,
          category: joke.category,
          viewedAt: now,
          date: today,
        };

        // Keep only last 90 days of history
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

        const filteredHistory = state.jokeHistory.filter(
          (h) => h.date >= cutoffDate
        );

        return {
          jokeHistory: [entry, ...filteredHistory].slice(0, 500), // Max 500 entries
        };
      }),

      getHistoryByDate: (date) => {
        const { jokeHistory } = get();
        return jokeHistory.filter((h) => h.date === date);
      },

      clearHistory: () => set({ jokeHistory: [] }),

      // Achievement actions (Premium)
      checkAchievements: () => set((state) => {
        const { favorites, totalShareCount, categoriesExplored, collections, streak } = state;
        const achievements = [...state.achievements];

        const updateProgress = (id: string, currentProgress: number) => {
          const index = achievements.findIndex((a) => a.id === id);
          if (index === -1) return;

          const achievement = achievements[index];
          const newProgress = Math.min(currentProgress, achievement.target);

          if (achievement.progress !== newProgress) {
            achievements[index] = {
              ...achievement,
              progress: newProgress,
              unlockedAt: newProgress >= achievement.target && !achievement.unlockedAt
                ? new Date().toISOString()
                : achievement.unlockedAt,
            };
          }
        };

        // Update viewing achievements
        const totalViewed = streak.totalJokesViewed;
        updateProgress('first_joke', totalViewed);
        updateProgress('jokes_10', totalViewed);
        updateProgress('jokes_50', totalViewed);
        updateProgress('jokes_100', totalViewed);
        updateProgress('jokes_500', totalViewed);
        updateProgress('jokes_1000', totalViewed);

        // Update sharing achievements
        updateProgress('first_share', totalShareCount);
        updateProgress('shares_10', totalShareCount);
        updateProgress('shares_50', totalShareCount);
        updateProgress('shares_100', totalShareCount);

        // Update favorites achievements
        const favCount = favorites.length;
        updateProgress('first_fav', favCount);
        updateProgress('favs_10', favCount);
        updateProgress('favs_25', favCount);
        updateProgress('favs_50', favCount);

        // Update category achievements
        const catCount = categoriesExplored.length;
        updateProgress('cat_explorer', catCount);
        updateProgress('cat_master', catCount);

        // Update collection achievements
        const collCount = collections.length;
        updateProgress('first_collection', collCount);
        updateProgress('collections_5', collCount);

        // Update streak achievements
        const currentStreak = streak.currentStreak;
        updateProgress('streak_3', currentStreak);
        updateProgress('streak_7', currentStreak);
        updateProgress('streak_30', currentStreak);

        return { achievements };
      }),

      getUnlockedAchievements: () => {
        const { achievements } = get();
        return achievements.filter((a) => a.unlockedAt !== null);
      },

      getLockedAchievements: () => {
        const { achievements } = get();
        return achievements.filter((a) => a.unlockedAt === null);
      },

      // Custom Reminders actions (Premium)
      addReminder: (hour, minute, label) => {
        const id = `reminder_${Date.now()}`;
        set((state) => ({
          customReminders: [
            ...state.customReminders,
            { id, hour, minute, enabled: true, label },
          ],
        }));
        return id;
      },

      updateReminder: (id, updates) => set((state) => ({
        customReminders: state.customReminders.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      })),

      deleteReminder: (id) => set((state) => ({
        customReminders: state.customReminders.filter((r) => r.id !== id),
      })),

      toggleReminder: (id) => set((state) => ({
        customReminders: state.customReminders.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        ),
      })),

      // Category tracking
      trackCategoryExplored: (category) => set((state) => {
        if (state.categoriesExplored.includes(category)) return state;
        return {
          categoriesExplored: [...state.categoriesExplored, category],
        };
      }),

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

          // Data synced to cloud successfully
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

          // Data loaded from cloud successfully
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
        jokeHistory: state.jokeHistory,
        achievements: state.achievements,
        customReminders: state.customReminders,
        totalShareCount: state.totalShareCount,
        categoriesExplored: state.categoriesExplored,
      }),
    }
  )
);

export default useAppStore;
