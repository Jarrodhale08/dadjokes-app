/**
 * Social Share Modal Component
 * Modal for sharing jokes to various social media platforms
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setStringAsync } from 'expo-clipboard';
import { colors } from '../theme/colors';
import {
  socialPlatforms,
  shareToSocialMedia,
  getFormattedJokeText,
} from '../services/socialShare.service';
import type { SocialPlatform } from '../services/socialShare.service';

interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  joke: string;
  includeAppLink?: boolean;
  onShare?: () => void; // Callback when a joke is successfully shared
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  visible,
  onClose,
  joke,
  includeAppLink = true,
  onShare,
}) => {
  const handleShare = useCallback(async (platform: SocialPlatform) => {
    if (platform === 'copy') {
      const formattedText = getFormattedJokeText(joke, includeAppLink);
      await setStringAsync(formattedText);
      Alert.alert('Copied!', 'Joke copied to clipboard');
      onShare?.();
      onClose();
      return;
    }

    const result = await shareToSocialMedia(platform, joke, includeAppLink);

    if (!result.success && result.error) {
      Alert.alert('Share Error', result.error);
    } else if (result.success) {
      onShare?.();
      onClose();
    }
  }, [joke, includeAppLink, onClose, onShare]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share this joke</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Joke Preview */}
          <View style={styles.jokePreview}>
            <Text style={styles.jokeText} numberOfLines={4}>
              {joke}
            </Text>
          </View>

          {/* Social Platforms Grid */}
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.platformsContainer}
          >
            <View style={styles.platformsGrid}>
              {socialPlatforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={styles.platformButton}
                  onPress={() => handleShare(platform.id)}
                  accessibilityLabel={`Share to ${platform.name}`}
                >
                  <View
                    style={[
                      styles.platformIconContainer,
                      { backgroundColor: platform.color },
                    ]}
                  >
                    <Ionicons
                      name={platform.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.platformName} numberOfLines={1}>
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* App Link Toggle Info */}
          {includeAppLink && (
            <View style={styles.appLinkInfo}>
              <Ionicons name="link" size={16} color={colors.text.muted} />
              <Text style={styles.appLinkText}>
                App download link will be included
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: colors.surface.DEFAULT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jokePreview: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  jokeText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  platformsContainer: {
    padding: 20,
    paddingTop: 12,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  platformButton: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 20,
  },
  platformIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  platformName: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  appLinkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  appLinkText: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 6,
  },
});

export default SocialShareModal;
