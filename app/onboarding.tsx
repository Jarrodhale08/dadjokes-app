/**
 * Onboarding Screen - 7-Day Free Trial Introduction
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../src/theme/colors';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'happy',
    iconColor: colors.primary.DEFAULT,
    iconBackground: colors.surface.elevated,
    title: 'Welcome to Dad Jokes!',
    description: 'Get ready for endless laughs with the best collection of dad jokes. Perfect for any occasion!',
  },
  {
    id: '2',
    icon: 'infinite',
    iconColor: colors.accent.blue,
    iconBackground: '#1E3A5F',
    title: 'Unlimited Jokes',
    description: 'Access thousands of curated dad jokes. New jokes added regularly to keep the laughs coming!',
  },
  {
    id: '3',
    icon: 'heart',
    iconColor: colors.error,
    iconBackground: '#3D2A2A',
    title: 'Save Your Favorites',
    description: 'Heart the jokes you love and build your personal collection of go-to jokes.',
  },
  {
    id: '4',
    icon: 'share-social',
    iconColor: colors.accent.purple,
    iconBackground: '#2D2A3D',
    title: 'Share the Laughter',
    description: 'Easily share jokes with friends and family via text, social media, or anywhere else!',
  },
  {
    id: '5',
    icon: 'star',
    iconColor: '#FACC15',
    iconBackground: '#3D3A2A',
    title: 'Start Your 7-Day Free Trial',
    description: 'Try Dad Jokes Pro free for 7 days. Unlock all categories, ad-free experience, and exclusive jokes. Cancel anytime.',
  },
];

const ONBOARDING_KEY = '@dadjokes_onboarding_complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
    router.replace('/(tabs)');
  };

  const handleStartTrial = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
    router.replace('/subscription');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconBackground }]}>
        <Ionicons name={item.icon} size={80} color={item.iconColor} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isLastSlide && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.footer}>
        {isLastSlide ? (
          <View style={styles.trialButtons}>
            <TouchableOpacity
              style={styles.trialButton}
              onPress={handleStartTrial}
            >
              <Ionicons name="star" size={20} color={colors.text.inverse} />
              <Text style={styles.trialButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipTrialButton}
              onPress={completeOnboarding}
            >
              <Text style={styles.skipTrialText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    minHeight: 44,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: colors.text.muted,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.DEFAULT,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  nextButton: {
    backgroundColor: colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  trialButtons: {
    gap: 12,
  },
  trialButton: {
    backgroundColor: '#FACC15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  skipTrialButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipTrialText: {
    fontSize: 16,
    color: colors.text.muted,
    fontWeight: '500',
  },
});
