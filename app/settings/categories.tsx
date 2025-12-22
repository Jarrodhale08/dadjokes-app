import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/stores/appStore';
import { CATEGORY_INFO, JokeCategory, getAllCategories } from '../../src/data/jokeLibrary';

export default function CategoriesScreen() {
  const router = useRouter();
  const { userPreferences, setUserPreferences } = useAppStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    userPreferences.favoriteCategories || []
  );

  const allCategories = getAllCategories();

  const toggleCategory = useCallback((category: JokeCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const handleSave = useCallback(() => {
    setUserPreferences({ favoriteCategories: selectedCategories });
    Alert.alert(
      'Preferences Saved',
      'Your favorite categories have been updated.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/settings') }]
    );
  }, [selectedCategories, setUserPreferences, router]);

  const handleSelectAll = useCallback(() => {
    if (selectedCategories.length === allCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...allCategories]);
    }
  }, [selectedCategories, allCategories]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={handleSelectAll}>
          <Text style={styles.selectAllText}>
            {selectedCategories.length === allCategories.length ? 'Clear' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.description}>
          Select your favorite joke categories. We'll prioritize showing you jokes from these categories.
        </Text>

        <View style={styles.categoriesGrid}>
          {allCategories.map((category) => {
            const info = CATEGORY_INFO[category];
            const isSelected = selectedCategories.includes(category);

            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                onPress={() => toggleCategory(category)}
                accessibilityLabel={`${info.label} category, ${isSelected ? 'selected' : 'not selected'}`}
              >
                <Text style={styles.categoryEmoji}>{info.emoji}</Text>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>
                  {info.label}
                </Text>
                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {info.description}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {selectedCategories.length === 0
            ? 'All categories will be shown'
            : `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`}
        </Text>
      </ScrollView>
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
  selectAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryLabelSelected: {
    color: '#EF4444',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});
