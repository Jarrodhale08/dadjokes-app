import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const [settings, setSettings] = useState({
    analytics: true,
    crashReports: true,
    personalizedAds: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Data Deleted', 'All your data has been deleted.') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Your data export has been started. You will receive an email when ready.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>

          <View style={styles.option}>
            <Ionicons name="analytics-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Analytics</Text>
              <Text style={styles.optionDescription}>Help improve the app with usage data</Text>
            </View>
            <Switch
              value={settings.analytics}
              onValueChange={() => toggleSetting('analytics')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.analytics ? '#EF4444' : '#9CA3AF'}
            />
          </View>

          <View style={styles.option}>
            <Ionicons name="bug-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Crash Reports</Text>
              <Text style={styles.optionDescription}>Send crash reports to fix bugs</Text>
            </View>
            <Switch
              value={settings.crashReports}
              onValueChange={() => toggleSetting('crashReports')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.crashReports ? '#EF4444' : '#9CA3AF'}
            />
          </View>

          <View style={styles.option}>
            <Ionicons name="eye-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Personalized Ads</Text>
              <Text style={styles.optionDescription}>Show relevant advertisements</Text>
            </View>
            <Switch
              value={settings.personalizedAds}
              onValueChange={() => toggleSetting('personalizedAds')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.personalizedAds ? '#EF4444' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Ionicons name="download-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Export My Data</Text>
              <Text style={styles.optionDescription}>Download a copy of your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteData}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: '#EF4444' }]}>Delete All Data</Text>
              <Text style={styles.optionDescription}>Permanently remove your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 72,
  },
  actionButton: {
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
    marginRight: 12,
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
});
