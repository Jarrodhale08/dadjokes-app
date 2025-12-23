import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../src/theme/colors';

import '../global.css';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      onError: (error) => {
        if ('message' in error) {
          console.error(error.message);
        }
      },
    },
  },
});

const ONBOARDING_KEY = '@dadjokes_onboarding_complete';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.warn('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [isLoading, hasCompletedOnboarding, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.DEFAULT },
      }}
    >
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      <Stack.Screen name="library" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.DEFAULT,
  },
});
