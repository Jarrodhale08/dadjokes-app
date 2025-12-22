import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL || API_URL.trim() === '') {
  throw new Error('EXPO_PUBLIC_API_URL must be a non-empty string');
}

interface JokeResponse {
  id: string;
  setup: string;
  punchline: string;
  category: string;
  rating: number;
  createdAt: string;
}

interface FavoriteResponse {
  id: string;
  jokeId: string;
  userId: string;
  createdAt: string;
}

interface UserPreferencesResponse {
  userId: string;
  favoriteCategories: string[];
  excludedCategories: string[];
}

interface ShareResponse {
  shareId: string;
  jokeId: string;
  shareUrl: string;
  expiresAt: string;
}

interface RecommendationResponse {
  jokes: JokeResponse[];
  basedOn: string[];
}

interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await SecureStore.getItemAsync('auth_token');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Token retrieval failed:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          try {
            await SecureStore.deleteItemAsync('auth_token');
          } catch (deleteError) {
            console.warn('Failed to delete auth token:', deleteError);
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError<ApiErrorResponse>): Error {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      const statusCode = error.response.status;
      return new Error(`[${statusCode}] ${message}`);
    } else if (error.request) {
      return new Error('No response received from server. Please check your network connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  async getAll<T>(endpoint: string): Promise<T[]> {
    const response = await this.client.get<T[]>(endpoint);
    return response.data;
  }

  async getById<T>(endpoint: string, id: string): Promise<T> {
    const sanitizedId = id.trim().slice(0, 100);
    const response = await this.client.get<T>(`${endpoint}/${sanitizedId}`);
    return response.data;
  }

  async create<T>(endpoint: string, data: Partial<T>): Promise<T> {
    const response = await this.client.post<T>(endpoint, data);
    return response.data;
  }

  async update<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
    const sanitizedId = id.trim().slice(0, 100);
    const response = await this.client.put<T>(`${endpoint}/${sanitizedId}`, data);
    return response.data;
  }

  async delete(endpoint: string, id: string): Promise<void> {
    const sanitizedId = id.trim().slice(0, 100);
    await this.client.delete(`${endpoint}/${sanitizedId}`);
  }

  async getJokes(category?: string, limit: number = 20): Promise<JokeResponse[]> {
    const sanitizedCategory = category?.trim().slice(0, 50);
    const params = new URLSearchParams();
    if (sanitizedCategory) {
      params.append('category', sanitizedCategory);
    }
    params.append('limit', Math.min(Math.max(limit, 1), 100).toString());
    const response = await this.client.get<JokeResponse[]>(`/jokes?${params.toString()}`);
    return response.data;
  }

  async getJokeById(id: string): Promise<JokeResponse> {
    return this.getById<JokeResponse>('/jokes', id);
  }

  async getRandomJoke(category?: string): Promise<JokeResponse> {
    const sanitizedCategory = category?.trim().slice(0, 50);
    const params = sanitizedCategory ? `?category=${sanitizedCategory}` : '';
    const response = await this.client.get<JokeResponse>(`/jokes/random${params}`);
    return response.data;
  }

  async getFavorites(): Promise<FavoriteResponse[]> {
    const response = await this.client.get<FavoriteResponse[]>('/favorites');
    return response.data;
  }

  async addFavorite(jokeId: string): Promise<FavoriteResponse> {
    const sanitizedJokeId = jokeId.trim().slice(0, 100);
    const response = await this.client.post<FavoriteResponse>('/favorites', { jokeId: sanitizedJokeId });
    return response.data;
  }

  async removeFavorite(favoriteId: string): Promise<void> {
    await this.delete('/favorites', favoriteId);
  }

  async shareJoke(jokeId: string): Promise<ShareResponse> {
    const sanitizedJokeId = jokeId.trim().slice(0, 100);
    const response = await this.client.post<ShareResponse>('/shares', { jokeId: sanitizedJokeId });
    return response.data;
  }

  async getRecommendations(): Promise<RecommendationResponse> {
    const response = await this.client.get<RecommendationResponse>('/recommendations');
    return response.data;
  }

  async getUserPreferences(): Promise<UserPreferencesResponse> {
    const response = await this.client.get<UserPreferencesResponse>('/preferences');
    return response.data;
  }

  async updateUserPreferences(preferences: Partial<UserPreferencesResponse>): Promise<UserPreferencesResponse> {
    const sanitizedPreferences = {
      ...preferences,
      favoriteCategories: preferences.favoriteCategories?.map(cat => cat.trim().slice(0, 50)),
      excludedCategories: preferences.excludedCategories?.map(cat => cat.trim().slice(0, 50)),
    };
    const response = await this.client.put<UserPreferencesResponse>('/preferences', sanitizedPreferences);
    return response.data;
  }

  async rateJoke(jokeId: string, rating: number): Promise<void> {
    const sanitizedJokeId = jokeId.trim().slice(0, 100);
    const sanitizedRating = Math.min(Math.max(rating, 1), 5);
    await this.client.post('/ratings', { jokeId: sanitizedJokeId, rating: sanitizedRating });
  }

  async searchJokes(query: string): Promise<JokeResponse[]> {
    const sanitizedQuery = query.trim().slice(0, 200);
    const response = await this.client.get<JokeResponse[]>(`/jokes/search?q=${encodeURIComponent(sanitizedQuery)}`);
    return response.data;
  }

  async setAuthToken(token: string): Promise<void> {
    const sanitizedToken = token.trim();
    await SecureStore.setItemAsync('auth_token', sanitizedToken);
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch (error) {
      console.warn('Failed to retrieve auth token:', error);
      return null;
    }
  }

  async clearAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.warn('Failed to clear auth token:', error);
    }
  }
}

const apiService = new ApiService();
export default apiService;
