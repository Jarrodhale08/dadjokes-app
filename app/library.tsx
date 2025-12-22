import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  JOKE_LIBRARY,
  CATEGORY_INFO,
  JokeCategory,
  LibraryJoke,
  getAllCategories,
  getJokesByCategory,
  searchJokes,
  getTopRatedJokes,
} from '../src/data/jokeLibrary';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { useAppStore } from '../src/stores/appStore';

type FilterType = 'all' | 'top-rated' | JokeCategory;

export default function LibraryScreen() {
  const router = useRouter();
  const { isPremium } = useSubscriptionStore();
  const { favorites, toggleFavorite, jokes: savedJokes, addJoke } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Redirect to subscription if not premium
  if (!isPremium()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Joke Library</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Unlock the full joke library with {JOKE_LIBRARY.length}+ curated dad jokes across {getAllCategories().length} categories.
          </Text>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => router.push('/subscription')}
            accessibilityLabel="Unlock premium"
          >
            <Text style={styles.unlockButtonText}>Unlock Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filter and search jokes
  const filteredJokes = useMemo(() => {
    let jokes: LibraryJoke[] = [];

    if (selectedFilter === 'all') {
      jokes = [...JOKE_LIBRARY];
    } else if (selectedFilter === 'top-rated') {
      jokes = getTopRatedJokes(50);
    } else {
      jokes = getJokesByCategory(selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      jokes = jokes.filter(joke =>
        joke.joke.toLowerCase().includes(query)
      );
    }

    return jokes;
  }, [selectedFilter, searchQuery]);

  const handleToggleFavorite = useCallback((joke: LibraryJoke) => {
    const existsInStore = savedJokes.some(j => j.id === joke.id);
    if (!existsInStore) {
      addJoke({
        id: joke.id,
        setup: joke.joke,
        punchline: '',
        category: joke.category,
        rating: joke.rating,
        isFavorite: true,
        shareCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    toggleFavorite(joke.id);
  }, [savedJokes, addJoke, toggleFavorite]);

  const handleShare = useCallback(async (joke: LibraryJoke) => {
    try {
      await Share.share({
        message: `${joke.joke}\n\n- Shared from Dad Jokes App`,
      });
    } catch (err) {
      console.warn('Failed to share joke:', err);
    }
  }, []);

  const renderJokeItem = useCallback(({ item }: { item: LibraryJoke }) => {
    const isFavorite = favorites.includes(item.id);
    const categoryInfo = CATEGORY_INFO[item.category];

    return (
      <View style={styles.jokeCard}>
        <View style={styles.jokeHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
            <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
          </View>
          <View style={styles.ratingContainer}>
            {Array.from({ length: item.rating }).map((_, i) => (
              <Text key={i} style={styles.ratingStar}>⭐</Text>
            ))}
          </View>
        </View>

        <Text style={styles.jokeText}>{item.joke}</Text>

        <View style={styles.jokeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleFavorite(item)}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#EF4444' : '#6B7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            accessibilityLabel="Share joke"
          >
            <Ionicons name="share-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [favorites, handleToggleFavorite, handleShare]);

  const renderFilterItem = useCallback(({ item }: { item: FilterType }) => {
    const isSelected = selectedFilter === item;
    let label: string;
    let emoji: string;

    if (item === 'all') {
      label = 'All Jokes';
      emoji = '📖';
    } else if (item === 'top-rated') {
      label = 'Top Rated';
      emoji = '⭐';
    } else {
      const info = CATEGORY_INFO[item];
      label = info.label;
      emoji = info.emoji;
    }

    return (
      <TouchableOpacity
        style={[styles.filterChip, isSelected && styles.filterChipSelected]}
        onPress={() => {
          setSelectedFilter(item);
          setShowFilters(false);
        }}
        accessibilityLabel={`Filter by ${label}`}
      >
        <Text style={styles.filterEmoji}>{emoji}</Text>
        <Text style={[styles.filterLabel, isSelected && styles.filterLabelSelected]}>
          {label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    );
  }, [selectedFilter]);

  const filterOptions: FilterType[] = ['all', 'top-rated', ...getAllCategories()];

  const currentFilterLabel = useMemo(() => {
    if (selectedFilter === 'all') return 'All Jokes';
    if (selectedFilter === 'top-rated') return 'Top Rated';
    return CATEGORY_INFO[selectedFilter].label;
  }, [selectedFilter]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Joke Library</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jokes..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
        accessibilityLabel="Toggle filters"
      >
        <Ionicons name="filter" size={20} color="#EF4444" />
        <Text style={styles.filterToggleText}>{currentFilterLabel}</Text>
        <Ionicons
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {/* Filter List */}
      {showFilters && (
        <View style={styles.filterListContainer}>
          <FlatList
            data={filterOptions}
            renderItem={renderFilterItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          />
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredJokes.length} joke{filteredJokes.length !== 1 ? 's' : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Jokes List */}
      <FlatList
        data={filteredJokes}
        renderItem={renderJokeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.jokesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No jokes found</Text>
            <Text style={styles.emptyText}>Try a different search or filter</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 44,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginHorizontal: 8,
  },
  filterListContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipSelected: {
    backgroundColor: '#EF4444',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterLabelSelected: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  jokesList: {
    padding: 16,
    paddingTop: 8,
  },
  jokeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  jokeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  ratingStar: {
    fontSize: 12,
  },
  jokeText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  jokeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  unlockButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
