/**
 * Social Share Service
 * Handles sharing jokes to various social media platforms
 */

import { Linking, Platform, Share } from 'react-native';

// App Store URLs - Update these with actual store URLs when published
const APP_STORE_URL = 'https://apps.apple.com/app/dad-jokes/id000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.dadjokes.app';

export type SocialPlatform =
  | 'twitter'
  | 'facebook'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'reddit'
  | 'sms'
  | 'email'
  | 'copy'
  | 'more';

export interface SocialPlatformInfo {
  id: SocialPlatform;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

const getAppDownloadLink = (): string => {
  return Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
};

const formatJokeForSharing = (joke: string, includeAppLink: boolean = true): string => {
  let message = `😂 ${joke}\n\n`;

  if (includeAppLink) {
    message += `📱 Get more dad jokes: ${getAppDownloadLink()}`;
  }

  return message;
};

const encodeForUrl = (text: string): string => {
  return encodeURIComponent(text);
};

export const socialPlatforms: SocialPlatformInfo[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'logo-twitter',
    color: '#000000',
    available: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    available: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    available: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'paper-plane',
    color: '#0088CC',
    available: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0A66C2',
    available: true,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'logo-reddit',
    color: '#FF4500',
    available: true,
  },
  {
    id: 'sms',
    name: 'Messages',
    icon: 'chatbubble',
    color: '#34C759',
    available: true,
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'mail',
    color: '#007AFF',
    available: true,
  },
  {
    id: 'copy',
    name: 'Copy',
    icon: 'copy',
    color: '#8E8E93',
    available: true,
  },
  {
    id: 'more',
    name: 'More',
    icon: 'ellipsis-horizontal',
    color: '#8E8E93',
    available: true,
  },
];

export const shareToSocialMedia = async (
  platform: SocialPlatform,
  joke: string,
  includeAppLink: boolean = true
): Promise<{ success: boolean; error?: string }> => {
  const formattedJoke = formatJokeForSharing(joke, includeAppLink);
  const encodedJoke = encodeForUrl(formattedJoke);
  const encodedJokeOnly = encodeForUrl(joke);
  const appLink = getAppDownloadLink();

  try {
    let url: string | null = null;

    switch (platform) {
      case 'twitter':
        // X/Twitter with tweet intent
        url = `https://twitter.com/intent/tweet?text=${encodedJoke}`;
        break;

      case 'facebook':
        // Facebook share dialog
        url = `https://www.facebook.com/sharer/sharer.php?quote=${encodedJoke}`;
        break;

      case 'whatsapp':
        // WhatsApp with pre-filled message
        url = `whatsapp://send?text=${encodedJoke}`;
        break;

      case 'telegram':
        // Telegram share
        url = `tg://msg?text=${encodedJoke}`;
        break;

      case 'linkedin':
        // LinkedIn share
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeForUrl(appLink)}&summary=${encodedJokeOnly}`;
        break;

      case 'reddit':
        // Reddit submit
        url = `https://www.reddit.com/submit?title=${encodeForUrl('Check out this dad joke! 😂')}&text=${encodedJoke}`;
        break;

      case 'sms':
        // SMS/Messages
        url = Platform.OS === 'ios'
          ? `sms:&body=${encodedJoke}`
          : `sms:?body=${encodedJoke}`;
        break;

      case 'email':
        // Email with subject and body
        const subject = encodeForUrl('Check out this hilarious dad joke! 😂');
        url = `mailto:?subject=${subject}&body=${encodedJoke}`;
        break;

      case 'copy':
        // Copy to clipboard - handled separately
        return { success: true };

      case 'more':
        // Use native share sheet
        const result = await Share.share({
          message: formattedJoke,
        });
        return {
          success: result.action !== Share.dismissedAction
        };

      default:
        return { success: false, error: 'Unknown platform' };
    }

    if (url) {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        return { success: true };
      } else {
        // Fallback to web version if app not installed
        let webFallback: string | null = null;

        switch (platform) {
          case 'whatsapp':
            webFallback = `https://web.whatsapp.com/send?text=${encodedJoke}`;
            break;
          case 'telegram':
            webFallback = `https://t.me/share/url?text=${encodedJoke}`;
            break;
          default:
            // For platforms with web URLs, try opening directly
            if (url.startsWith('https://')) {
              webFallback = url;
            }
        }

        if (webFallback) {
          await Linking.openURL(webFallback);
          return { success: true };
        }

        return {
          success: false,
          error: `${socialPlatforms.find(p => p.id === platform)?.name || platform} is not installed`
        };
      }
    }

    return { success: false, error: 'Unable to share' };
  } catch (error) {
    console.error('Share error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share'
    };
  }
};

export const getFormattedJokeText = (joke: string, includeAppLink: boolean = true): string => {
  return formatJokeForSharing(joke, includeAppLink);
};

export const getAppStoreUrl = (): string => {
  return getAppDownloadLink();
};

export default {
  shareToSocialMedia,
  socialPlatforms,
  getFormattedJokeText,
  getAppStoreUrl,
};
