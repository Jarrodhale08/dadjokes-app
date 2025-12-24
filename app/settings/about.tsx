import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function AboutScreen() {
  const router = useRouter();
  const appVersion = '1.0.0';
  const buildNumber = '1';

  const handlePrivacyPolicy = () => {
    router.push('/settings/privacy');
  };

  const handleTermsOfService = () => {
    router.push('/settings/terms');
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconEmoji}>😂</Text>
          </View>
          <Text style={styles.appName}>Dad Jokes</Text>
          <Text style={styles.appVersion}>Version {appVersion} ({buildNumber})</Text>
          <Text style={styles.appTagline}>Your Daily Dose of Humor</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.option} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary.DEFAULT} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleTermsOfService}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary.DEFAULT} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
          </TouchableOpacity>

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>{buildNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>React Native / Expo</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with AppForge AI</Text>
          <Text style={styles.copyright}>© {new Date().getFullYear()} Dad Jokes. All rights reserved.</Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.primary.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: colors.text.muted,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.DEFAULT,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 56,
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.DEFAULT,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    minHeight: 50,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text.muted,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
