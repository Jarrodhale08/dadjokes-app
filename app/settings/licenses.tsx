import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

interface License {
  name: string;
  version: string;
  license: string;
  url: string;
}

const LICENSES: License[] = [
  {
    name: 'React Native',
    version: '0.81.4',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native',
  },
  {
    name: 'Expo',
    version: '54.0.0',
    license: 'MIT',
    url: 'https://github.com/expo/expo',
  },
  {
    name: 'Expo Router',
    version: '6.0.10',
    license: 'MIT',
    url: 'https://github.com/expo/router',
  },
  {
    name: 'Zustand',
    version: '5.0.3',
    license: 'MIT',
    url: 'https://github.com/pmndrs/zustand',
  },
  {
    name: 'Supabase JS',
    version: '2.49.1',
    license: 'MIT',
    url: 'https://github.com/supabase/supabase-js',
  },
  {
    name: 'React Native Reanimated',
    version: '4.1.1',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-reanimated',
  },
  {
    name: 'React Native Gesture Handler',
    version: '2.28.0',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-gesture-handler',
  },
  {
    name: 'React Native Purchases (RevenueCat)',
    version: '8.1.0',
    license: 'MIT',
    url: 'https://github.com/RevenueCat/react-native-purchases',
  },
  {
    name: 'React Query',
    version: '5.74.4',
    license: 'MIT',
    url: 'https://github.com/TanStack/query',
  },
  {
    name: 'Axios',
    version: '1.8.4',
    license: 'MIT',
    url: 'https://github.com/axios/axios',
  },
  {
    name: 'Expo Linear Gradient',
    version: '14.0.0',
    license: 'MIT',
    url: 'https://github.com/expo/expo/tree/main/packages/expo-linear-gradient',
  },
  {
    name: 'AsyncStorage',
    version: '2.1.0',
    license: 'MIT',
    url: 'https://github.com/react-native-async-storage/async-storage',
  },
  {
    name: 'Expo Secure Store',
    version: '15.0.0',
    license: 'MIT',
    url: 'https://github.com/expo/expo/tree/main/packages/expo-secure-store',
  },
  {
    name: 'Expo Notifications',
    version: '0.31.0',
    license: 'MIT',
    url: 'https://github.com/expo/expo/tree/main/packages/expo-notifications',
  },
  {
    name: 'React Native SVG',
    version: '15.15.0',
    license: 'MIT',
    url: 'https://github.com/software-mansion/react-native-svg',
  },
];

export default function LicensesScreen() {
  const router = useRouter();

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/settings')}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Source Licenses</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.introText}>
          Dad Jokes is built with the help of open source software.
          We are grateful to the developers and maintainers of these projects.
        </Text>

        <View style={styles.licensesList}>
          {LICENSES.map((license, index) => (
            <TouchableOpacity
              key={index}
              style={styles.licenseCard}
              onPress={() => handleOpenUrl(license.url)}
              accessibilityLabel={`View ${license.name} on GitHub`}
            >
              <View style={styles.licenseInfo}>
                <Text style={styles.licenseName}>{license.name}</Text>
                <Text style={styles.licenseVersion}>v{license.version}</Text>
              </View>
              <View style={styles.licenseRight}>
                <View style={styles.licenseBadge}>
                  <Text style={styles.licenseBadgeText}>{license.license}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.text.muted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mitLicenseSection}>
          <Text style={styles.mitTitle}>MIT License</Text>
          <Text style={styles.mitText}>
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </Text>
          <Text style={styles.mitText}>
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </Text>
          <Text style={styles.mitText}>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap any library to view its source code on GitHub.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
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
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  licensesList: {
    marginBottom: 32,
  },
  licenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  licenseInfo: {
    flex: 1,
  },
  licenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  licenseVersion: {
    fontSize: 13,
    color: colors.text.muted,
  },
  licenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  licenseBadge: {
    backgroundColor: colors.primary.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  licenseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  mitLicenseSection: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  mitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  mitText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
