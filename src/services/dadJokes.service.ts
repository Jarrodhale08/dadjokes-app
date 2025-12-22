/**
 * Dad Jokes API Service
 * Uses the free icanhazdadjoke.com API (no authentication required)
 *
 * API Documentation: https://icanhazdadjoke.com/api
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'https://icanhazdadjoke.com';

// Response types from the API
export interface DadJoke {
  id: string;
  joke: string;
  status: number;
}

export interface SearchResult {
  current_page: number;
  limit: number;
  next_page: number;
  previous_page: number;
  results: DadJoke[];
  search_term: string;
  status: number;
  total_jokes: number;
  total_pages: number;
}

class DadJokesService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        // Best practice: Set a custom User-Agent as requested by the API
        'User-Agent': 'DadJokesApp (https://github.com/appforge-ai)',
      },
    });
  }

  /**
   * Get a random dad joke
   */
  async getRandomJoke(): Promise<DadJoke> {
    try {
      const response = await this.client.get<DadJoke>('/');
      return response.data;
    } catch (error) {
      console.error('[DadJokesService] Failed to fetch random joke:', error);
      throw new Error('Failed to fetch a random joke. Please try again.');
    }
  }

  /**
   * Get a specific joke by ID
   */
  async getJokeById(id: string): Promise<DadJoke> {
    try {
      const cleanId = id.trim().slice(0, 50);
      const response = await this.client.get<DadJoke>(`/j/${cleanId}`);
      return response.data;
    } catch (error) {
      console.error('[DadJokesService] Failed to fetch joke by ID:', error);
      throw new Error('Failed to fetch the joke. Please try again.');
    }
  }

  /**
   * Search for jokes by term
   * @param term - Search term
   * @param page - Page number (default 1)
   * @param limit - Results per page (default 20, max 30)
   */
  async searchJokes(term: string, page: number = 1, limit: number = 20): Promise<SearchResult> {
    try {
      const cleanTerm = term.trim().slice(0, 100);
      const safeLimit = Math.min(Math.max(1, limit), 30);
      const safePage = Math.max(1, page);

      const response = await this.client.get<SearchResult>('/search', {
        params: {
          term: cleanTerm,
          page: safePage,
          limit: safeLimit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('[DadJokesService] Failed to search jokes:', error);
      throw new Error('Failed to search for jokes. Please try again.');
    }
  }

  /**
   * Get multiple random jokes
   * Note: The API only returns one joke at a time, so we make multiple requests
   * @param count - Number of jokes to fetch (max 10 to avoid rate limiting)
   */
  async getMultipleRandomJokes(count: number = 5): Promise<DadJoke[]> {
    const safeCount = Math.min(Math.max(1, count), 10);
    const jokes: DadJoke[] = [];
    const seenIds = new Set<string>();

    try {
      // Fetch jokes in parallel for better performance
      const promises = Array.from({ length: safeCount }, () => this.getRandomJoke());
      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === 'fulfilled' && !seenIds.has(result.value.id)) {
          seenIds.add(result.value.id);
          jokes.push(result.value);
        }
      }

      // If we got duplicates, try to fetch more
      while (jokes.length < safeCount) {
        try {
          const joke = await this.getRandomJoke();
          if (!seenIds.has(joke.id)) {
            seenIds.add(joke.id);
            jokes.push(joke);
          }
        } catch {
          break; // Stop if we hit rate limits or errors
        }
      }

      return jokes;
    } catch (error) {
      console.error('[DadJokesService] Failed to fetch multiple jokes:', error);
      // Return whatever jokes we managed to get
      return jokes.length > 0 ? jokes : Promise.reject(new Error('Failed to fetch jokes'));
    }
  }
}

// Export singleton instance
export const dadJokesService = new DadJokesService();
export default dadJokesService;
