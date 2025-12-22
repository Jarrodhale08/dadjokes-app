import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  avatar?: string;
  name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  fitnessGoal?: string;
}

interface ProfileState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearProfile: () => Promise<void>;
}

// SecureStore helpers for sensitive data
const STORAGE_KEY = 'profile_data';

const saveToSecureStore = async (data: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save profile to SecureStore:', error);
  }
};

const loadFromSecureStore = async (): Promise<User | null> => {
  try {
    const data = await SecureStore.getItemAsync(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load profile from SecureStore:', error);
    return null;
  }
};

const deleteFromSecureStore = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to delete profile from SecureStore:', error);
  }
};

export const useProfileStore = create<ProfileState>()(
  (set, get) => ({
    user: null,
    loading: false,
    error: null,

    fetchProfile: async () => {
      set({ loading: true, error: null });
      try {
        const data = await loadFromSecureStore();
        set({ user: data, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load profile',
          loading: false
        });
      }
    },

    updateProfile: async (data: Partial<User>) => {
      set({ loading: true, error: null });
      try {
        const currentProfile = get().user;
        const updatedProfile: User = {
          name: data.name ?? currentProfile?.name ?? '',
          email: data.email ?? currentProfile?.email ?? '',
          avatar: data.avatar ?? currentProfile?.avatar,
          weight: data.weight ?? currentProfile?.weight,
          height: data.height ?? currentProfile?.height,
          age: data.age ?? currentProfile?.age,
          fitnessGoal: data.fitnessGoal ?? currentProfile?.fitnessGoal,
        };
        await saveToSecureStore(updatedProfile);
        set({ user: updatedProfile, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to update profile',
          loading: false
        });
      }
    },

    clearProfile: async () => {
      await deleteFromSecureStore();
      set({ user: null, loading: false, error: null });
    },
  })
);
