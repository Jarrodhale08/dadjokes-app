import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const router = useRouter();
  const handleEmail = () => {
    Linking.openURL('mailto:support@example.com?subject=DadJokes%20Support');
  };

  const handleFAQ = () => {
    Alert.alert('FAQ', 'Frequently Asked Questions would open here.');
  };

  const handleGuide = () => {
    Alert.alert('User Guide', 'The user guide would open here.');
  };

  const handleFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'We\'d love to hear from you!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Feedback', onPress: handleEmail },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report a Bug',
      'Help us fix issues by reporting bugs.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report Bug', onPress: handleEmail },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>

          <TouchableOpacity style={styles.option} onPress={handleFAQ}>
            <Ionicons name="help-circle-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>FAQ</Text>
              <Text style={styles.optionDescription}>Find answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleGuide}>
            <Ionicons name="book-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>User Guide</Text>
              <Text style={styles.optionDescription}>Learn how to use DadJokes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Contact Support</Text>
              <Text style={styles.optionDescription}>Get help from our team</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>

          <TouchableOpacity style={styles.option} onPress={handleFeedback}>
            <Ionicons name="chatbubble-outline" size={24} color="#6366F1" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Send Feedback</Text>
              <Text style={styles.optionDescription}>Share your thoughts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleReport}>
            <Ionicons name="bug-outline" size={24} color="#F59E0B" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Report a Bug</Text>
              <Text style={styles.optionDescription}>Help us fix issues</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need immediate help?</Text>
          <Text style={styles.contactText}>
            Email us at support@dadjokesapp.com and we'll get back to you within 24 hours.
          </Text>
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 72,
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
