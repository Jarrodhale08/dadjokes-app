import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { dadJokesService, DadJoke } from '../../src/services/dadJokes.service';
import { useAppStore } from '../../src/stores/appStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import {
  CATEGORY_INFO,
  JokeCategory,
  getAllCategories,
  getMultipleRandomJokes as getLibraryJokes,
  TOTAL_JOKES,
} from '../../src/data/jokeLibrary';
import { colors } from '../../src/theme/colors';
import { SocialShareModal } from '../../src/components/SocialShareModal';

interface DisplayJoke {
  id: string;
  joke: string;
  isFavorite: boolean;
  category?: JokeCategory;
}

export default function Screen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jokes, setJokes] = useState<DisplayJoke[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JokeCategory | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedJokeForShare, setSelectedJokeForShare] = useState<string>('');

  const { favorites, toggleFavorite, jokes: savedJokes, addJoke, recordJokeView } = useAppStore();
  const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();

  const premium = isPremium();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const toDisplayJoke = useCallback((apiJoke: DadJoke): DisplayJoke => ({
    id: apiJoke.id,
    joke: apiJoke.joke,
    isFavorite: favorites.includes(apiJoke.id),
  }), [favorites]);

  const loadJokes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      if (premium && selectedCategory) {
        const libraryJokes = getLibraryJokes(5, selectedCategory);
        setJokes(libraryJokes.map(j => ({
          id: j.id,
          joke: j.joke,
          isFavorite: favorites.includes(j.id),
          category: j.category,
        })));
      } else {
        const fetchedJokes = await dadJokesService.getMultipleRandomJokes(5);
        setJokes(fetchedJokes.map(toDisplayJoke));
      }
      recordJokeView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jokes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [premium, selectedCategory, favorites, toDisplayJoke, recordJokeView]);

  const loadMoreJokes = useCallback(async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);

      if (premium && selectedCategory) {
        const libraryJokes = getLibraryJokes(3, selectedCategory);
        const newJokes = libraryJokes.map(j => ({
          id: j.id,
          joke: j.joke,
          isFavorite: favorites.includes(j.id),
          category: j.category,
        }));
        setJokes(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const uniqueNew = newJokes.filter(j => !existingIds.has(j.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        const fetchedJokes = await dadJokesService.getMultipleRandomJokes(3);
        const newJokes = fetchedJokes.map(toDisplayJoke);
        setJokes(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const uniqueNew = newJokes.filter(j => !existingIds.has(j.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.warn('Failed to load more jokes:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, premium, selectedCategory, favorites, toDisplayJoke]);

  const getNewJoke = useCallback(async () => {
    try {
      if (premium && selectedCategory) {
        const libraryJokes = getLibraryJokes(1, selectedCategory);
        if (libraryJokes.length > 0) {
          const newJoke = {
            id: libraryJokes[0].id,
            joke: libraryJokes[0].joke,
            isFavorite: favorites.includes(libraryJokes[0].id),
            category: libraryJokes[0].category,
          };
          setJokes(prev => {
            const filtered = prev.filter(j => j.id !== newJoke.id);
            return [newJoke, ...filtered];
          });
        }
      } else {
        const newJoke = await dadJokesService.getRandomJoke();
        const displayJoke = toDisplayJoke(newJoke);
        setJokes(prev => {
          const filtered = prev.filter(j => j.id !== displayJoke.id);
          return [displayJoke, ...filtered];
        });
      }
      recordJokeView();
    } catch (err) {
      console.warn('Failed to get new joke:', err);
    }
  }, [premium, selectedCategory, favorites, toDisplayJoke, recordJokeView]);

  useEffect(() => {
    loadJokes();
  }, []);

  useEffect(() => {
    setJokes(prev => prev.map(joke => ({
      ...joke,
      isFavorite: favorites.includes(joke.id),
    })));
  }, [favorites]);

  useEffect(() => {
    if (premium) {
      loadJokes();
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJokes(false);
  }, [loadJokes]);

  const handleToggleFavorite = useCallback((joke: DisplayJoke) => {
    const existsInStore = savedJokes.some(j => j.id === joke.id);
    if (!existsInStore) {
      addJoke({
        id: joke.id,
        setup: joke.joke,
        punchline: '',
        category: joke.category || 'dad-joke',
        rating: 0,
        isFavorite: true,
        shareCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    toggleFavorite(joke.id);
  }, [savedJokes, addJoke, toggleFavorite]);

  const handleShare = useCallback((joke: DisplayJoke) => {
    setSelectedJokeForShare(joke.joke);
    setShareModalVisible(true);
  }, []);

  const handleCategorySelect = useCallback((category: JokeCategory | null) => {
    if (!premium) {
      router.push('/subscription');
      return;
    }
    setSelectedCategory(category);
  }, [premium, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Loading dad jokes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="sad-outline" size={64} color={colors.primary.DEFAULT} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadJokes()}
            accessibilityLabel="Retry loading jokes"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null && styles.categoryChipSelected,
          ]}
          onPress={() => handleCategorySelect(null)}
        >
          <Text style={styles.categoryChipEmoji}>🎲</Text>
          <Text style={[
            styles.categoryChipText,
            selectedCategory === null && styles.categoryChipTextSelected,
          ]}>
            Random
          </Text>
        </TouchableOpacity>

        {getAllCategories().slice(0, 6).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
              !premium && styles.categoryChipLocked,
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={styles.categoryChipEmoji}>
              {CATEGORY_INFO[category].emoji}
            </Text>
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextSelected,
            ]}>
              {CATEGORY_INFO[category].label.split(' ')[0]}
            </Text>
            {!premium && (
              <Ionicons name="lock-closed" size={12} color={colors.text.muted} style={styles.lockIcon} />
            )}
          </TouchableOpacity>
        ))}

        {premium && (
          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => router.push('/library' as any)}
          >
            <Text style={styles.categoryChipEmoji}>➕</Text>
            <Text style={styles.categoryChipText}>More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Premium Banner */}
      {!premium && (
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={() => router.push('/subscription')}
          accessibilityLabel="Unlock premium features"
        >
          <View style={styles.premiumBannerContent}>
            <Text style={styles.premiumBannerEmoji}>⭐</Text>
            <View style={styles.premiumBannerText}>
              <Text style={styles.premiumBannerTitle}>Unlock {TOTAL_JOKES}+ Jokes</Text>
              <Text style={styles.premiumBannerSubtitle}>Get category filters & full library</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary.dark} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
            title="Pull for new jokes..."
            titleColor={colors.text.secondary}
          />
        }
      >
        {/* New Joke Button */}
        <TouchableOpacity
          style={styles.newJokeButton}
          onPress={getNewJoke}
          accessibilityLabel="Get a new random joke"
          accessibilityRole="button"
        >
          <Ionicons name="shuffle" size={20} color={colors.text.inverse} />
          <Text style={styles.newJokeButtonText}>Get New Joke</Text>
        </TouchableOpacity>

        {/* Jokes List */}
        {jokes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="happy-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No Jokes Yet</Text>
            <Text style={styles.emptyText}>Pull down to refresh or tap the button above!</Text>
          </View>
        ) : (
          jokes.map((joke) => (
            <View key={joke.id} style={styles.card}>
              {joke.category && (
                <View style={styles.jokeCategoryBadge}>
                  <Text style={styles.jokeCategoryEmoji}>
                    {CATEGORY_INFO[joke.category].emoji}
                  </Text>
                  <Text style={styles.jokeCategoryText}>
                    {CATEGORY_INFO[joke.category].label}
                  </Text>
                </View>
              )}
              <Text style={styles.cardText}>{joke.joke}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleFavorite(joke)}
                  accessibilityLabel={joke.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={joke.isFavorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={joke.isFavorite ? colors.error : colors.text.muted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShare(joke)}
                  accessibilityLabel="Share this joke"
                  accessibilityRole="button"
                >
                  <Ionicons name="share-outline" size={24} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Load More Button */}
        {jokes.length > 0 && (
          <TouchableOpacity
            style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
            onPress={loadMoreJokes}
            disabled={loadingMore}
            accessibilityLabel="Load more jokes"
            accessibilityRole="button"
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary.DEFAULT} />
                <Text style={styles.loadMoreButtonText}>Load More Jokes</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Attribution */}
        <Text style={styles.attribution}>
          {premium && selectedCategory
            ? `From Dad Jokes Library - ${CATEGORY_INFO[selectedCategory].label}`
            : 'Jokes powered by icanhazdadjoke.com'}
        </Text>
      </ScrollView>

      {/* Social Share Modal */}
      <SocialShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        joke={selectedJokeForShare}
        includeAppLink={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  categoryScrollView: {
    backgroundColor: colors.background.secondary,
    maxHeight: 56,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: colors.surface.elevated,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  categoryChipLocked: {
    opacity: 0.7,
  },
  categoryChipEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: colors.text.inverse,
  },
  lockIcon: {
    marginLeft: 4,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.muted,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  premiumBannerSubtitle: {
    fontSize: 12,
    color: colors.mustache,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  newJokeButton: {
    backgroundColor: colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 48,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newJokeButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  jokeCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  jokeCategoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  jokeCategoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  cardText: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 28,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    borderRadius: 12,
    backgroundColor: colors.surface.DEFAULT,
    minHeight: 48,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreButtonText: {
    color: colors.primary.DEFAULT,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  attribution: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 8,
  },
});
