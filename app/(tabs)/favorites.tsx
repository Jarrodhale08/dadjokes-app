import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Share,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAppStore } from '../../src/stores/appStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { colors } from '../../src/theme/colors';
import { SocialShareModal } from '../../src/components/SocialShareModal';
import { CATEGORY_INFO, JokeCategory } from '../../src/data/jokeLibrary';

interface FavoriteJoke {
  id: string;
  setup: string;
  punchline: string;
  category: string;
  rating: number;
  shareCount: number;
  createdAt: string;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedJokeForShare, setSelectedJokeForShare] = useState('');
  const [selectedJokeIdForShare, setSelectedJokeIdForShare] = useState('');

  const { jokes, favorites, toggleFavorite, updateJokeRating, incrementShareCount, checkAchievements } = useAppStore();
  const { isPremium } = useSubscriptionStore();
  const premium = isPremium();

  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());
  const currentlyOpenSwipeable = useRef<string | null>(null);

  const favoriteJokes = useMemo(() => {
    return jokes.filter(joke => favorites.includes(joke.id));
  }, [jokes, favorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const handleSwipeOpen = useCallback((jokeId: string) => {
    if (currentlyOpenSwipeable.current && currentlyOpenSwipeable.current !== jokeId) {
      swipeableRefs.current.get(currentlyOpenSwipeable.current)?.close();
    }
    currentlyOpenSwipeable.current = jokeId;
  }, []);

  const handleRemoveFavorite = useCallback((joke: FavoriteJoke) => {
    Alert.alert(
      'Remove from Favorites?',
      'This joke will be removed from your favorites list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            toggleFavorite(joke.id);
            swipeableRefs.current.get(joke.id)?.close();
          },
        },
      ]
    );
  }, [toggleFavorite]);

  const handleShare = useCallback((joke: FavoriteJoke) => {
    const jokeText = joke.punchline
      ? `${joke.setup}\n\n${joke.punchline}`
      : joke.setup;
    setSelectedJokeForShare(jokeText);
    setSelectedJokeIdForShare(joke.id);
    setShareModalVisible(true);
  }, []);

  const handleShareComplete = useCallback(() => {
    if (selectedJokeIdForShare) {
      incrementShareCount(selectedJokeIdForShare);
      checkAchievements();
    }
  }, [selectedJokeIdForShare, incrementShareCount, checkAchievements]);

  const handleRate = useCallback((jokeId: string, rating: number) => {
    updateJokeRating(jokeId, rating);
  }, [updateJokeRating]);

  // Export favorites as text (Premium feature)
  const generateExportText = useCallback(() => {
    if (favoriteJokes.length === 0) return '';

    const header = `My Favorite Dad Jokes\n${'='.repeat(30)}\n\n`;
    const jokesText = favoriteJokes.map((joke, index) => {
      const categoryInfo = CATEGORY_INFO[joke.category as JokeCategory];
      const categoryLabel = categoryInfo ? `[${categoryInfo.label}]` : '';
      const rating = joke.rating > 0 ? ` ${'⭐'.repeat(joke.rating)}` : '';
      const text = joke.punchline
        ? `${joke.setup}\n${joke.punchline}`
        : joke.setup;
      return `${index + 1}. ${categoryLabel}${rating}\n${text}`;
    }).join('\n\n---\n\n');
    const footer = `\n\n${'='.repeat(30)}\nExported from Dad Jokes App\n${favoriteJokes.length} jokes`;

    return header + jokesText + footer;
  }, [favoriteJokes]);

  const handleExport = useCallback(() => {
    if (!premium) {
      Alert.alert(
        'Premium Feature',
        'Export your favorites collection is a premium feature. Upgrade to export your jokes!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription') },
        ]
      );
      return;
    }

    if (favoriteJokes.length === 0) {
      Alert.alert('No Favorites', 'Save some jokes first before exporting!');
      return;
    }

    const exportText = generateExportText();

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Copy to Clipboard', 'Share...'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await Clipboard.setStringAsync(exportText);
            Alert.alert('Copied!', 'Your favorites have been copied to clipboard.');
          } else if (buttonIndex === 2) {
            await Share.share({
              message: exportText,
              title: 'My Favorite Dad Jokes',
            });
          }
        }
      );
    } else {
      Alert.alert(
        'Export Favorites',
        'How would you like to export your jokes?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy to Clipboard',
            onPress: async () => {
              await Clipboard.setStringAsync(exportText);
              Alert.alert('Copied!', 'Your favorites have been copied to clipboard.');
            },
          },
          {
            text: 'Share',
            onPress: async () => {
              await Share.share({
                message: exportText,
                title: 'My Favorite Dad Jokes',
              });
            },
          },
        ]
      );
    }
  }, [premium, favoriteJokes, generateExportText, router]);

  const renderRightActions = useCallback((joke: FavoriteJoke) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleRemoveFavorite(joke)}
      accessibilityLabel="Remove from favorites"
    >
      <Ionicons name="trash" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  ), [handleRemoveFavorite]);

  const renderJokeCard = useCallback(({ item }: { item: FavoriteJoke }) => {
    const categoryInfo = CATEGORY_INFO[item.category as JokeCategory];

    return (
      <Swipeable
        ref={(ref) => swipeableRefs.current.set(item.id, ref)}
        renderRightActions={() => renderRightActions(item)}
        onSwipeableOpen={() => handleSwipeOpen(item.id)}
        overshootRight={false}
      >
        <View style={styles.card}>
          {categoryInfo && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
              <Text style={styles.categoryText}>{categoryInfo.label}</Text>
            </View>
          )}

          <Text style={styles.jokeText}>{item.setup}</Text>
          {item.punchline && (
            <Text style={styles.punchlineText}>{item.punchline}</Text>
          )}

          {/* Rating Stars */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(item.id, star)}
                  style={styles.starButton}
                  accessibilityLabel={`Rate ${star} stars`}
                >
                  <Ionicons
                    name={star <= item.rating ? 'star' : 'star-outline'}
                    size={20}
                    color={star <= item.rating ? colors.warning : colors.text.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              accessibilityLabel="Share this joke"
            >
              <Ionicons name="share-outline" size={22} color={colors.text.muted} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
              accessibilityLabel="Remove from favorites"
            >
              <Ionicons name="heart" size={22} color={colors.error} />
              <Text style={styles.actionText}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  }, [renderRightActions, handleSwipeOpen, handleRate, handleShare, toggleFavorite]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyText}>
        Tap the heart icon on any joke to save it here for later laughs!
      </Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Favorites</Text>
            <Text style={styles.headerSubtitle}>
              {favoriteJokes.length} saved joke{favoriteJokes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {favoriteJokes.length > 0 && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              accessibilityLabel="Export favorites"
            >
              <Ionicons
                name="download-outline"
                size={22}
                color={colors.text.inverse}
              />
              {!premium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={10} color={colors.warning} />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={favoriteJokes}
        keyExtractor={(item) => item.id}
        renderItem={renderJokeCard}
        contentContainerStyle={[
          styles.listContent,
          favoriteJokes.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <SocialShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        joke={selectedJokeForShare}
        includeAppLink={true}
        onShare={handleShareComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.inverse,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.inverse,
    opacity: 0.8,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  jokeText: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 28,
    marginBottom: 8,
  },
  punchlineText: {
    fontSize: 16,
    color: colors.primary.DEFAULT,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 16,
    minWidth: 44,
    minHeight: 44,
  },
  actionText: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginLeft: 12,
    borderRadius: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
