import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function TermsOfServiceScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: December 22, 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By downloading, installing, or using Dad Jokes ("the App"), you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please do not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            Dad Jokes is a mobile application that provides entertainment through curated dad jokes,
            including features such as:
          </Text>
          <Text style={styles.bulletPoint}>- Browsing and discovering dad jokes</Text>
          <Text style={styles.bulletPoint}>- Saving favorite jokes</Text>
          <Text style={styles.bulletPoint}>- Sharing jokes with friends</Text>
          <Text style={styles.bulletPoint}>- Rating jokes</Text>
          <Text style={styles.bulletPoint}>- Category filtering (Premium)</Text>
          <Text style={styles.bulletPoint}>- Daily streak tracking (Premium)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            To access certain features, you may need to create an account. You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>- Maintaining the confidentiality of your account credentials</Text>
          <Text style={styles.bulletPoint}>- All activities that occur under your account</Text>
          <Text style={styles.bulletPoint}>- Providing accurate and current information</Text>
          <Text style={styles.sectionText}>
            We reserve the right to suspend or terminate accounts that violate these terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Subscriptions & Payments</Text>
          <Text style={styles.sectionText}>
            Dad Jokes offers premium subscriptions through the App Store (iOS) and Google Play
            (Android). By subscribing:
          </Text>
          <Text style={styles.bulletPoint}>
            - Payment is charged to your app store account at confirmation of purchase
          </Text>
          <Text style={styles.bulletPoint}>
            - Subscriptions automatically renew unless canceled at least 24 hours before the
            end of the current period
          </Text>
          <Text style={styles.bulletPoint}>
            - You can manage and cancel subscriptions in your app store account settings
          </Text>
          <Text style={styles.bulletPoint}>
            - No refunds are provided for partial subscription periods
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Free Trial</Text>
          <Text style={styles.sectionText}>
            We may offer a free trial period for new subscribers. If you do not cancel before the
            trial ends, you will be automatically charged for the subscription. Trial eligibility
            is determined at our sole discretion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. User Content</Text>
          <Text style={styles.sectionText}>
            If you submit, share, or rate jokes within the App, you grant us a non-exclusive,
            royalty-free license to use, display, and distribute that content in connection with
            the App's operation and promotion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Prohibited Conduct</Text>
          <Text style={styles.sectionText}>You agree not to:</Text>
          <Text style={styles.bulletPoint}>
            - Use the App for any unlawful purpose
          </Text>
          <Text style={styles.bulletPoint}>
            - Attempt to gain unauthorized access to the App's systems
          </Text>
          <Text style={styles.bulletPoint}>
            - Interfere with or disrupt the App's operation
          </Text>
          <Text style={styles.bulletPoint}>
            - Reverse engineer, decompile, or disassemble the App
          </Text>
          <Text style={styles.bulletPoint}>
            - Use automated means to access or scrape content
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The App and its content, including but not limited to text, graphics, logos, and
            software, are owned by or licensed to us. Some jokes are sourced from the
            icanhazdadjoke.com API. You may not reproduce, distribute, or create derivative
            works without our express written permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
          <Text style={styles.sectionText}>
            The App may integrate with third-party services including:
          </Text>
          <Text style={styles.bulletPoint}>- Supabase (data storage and authentication)</Text>
          <Text style={styles.bulletPoint}>- RevenueCat (subscription management)</Text>
          <Text style={styles.bulletPoint}>- icanhazdadjoke.com (joke content API)</Text>
          <Text style={styles.sectionText}>
            Your use of these services is subject to their respective terms and policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Disclaimer of Warranties</Text>
          <Text style={styles.sectionText}>
            THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE
            THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. YOUR USE OF THE APP
            IS AT YOUR OWN RISK.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE
            OF THE APP.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We may update these Terms of Service from time to time. Continued use of the App
            after changes are posted constitutes acceptance of the revised terms. We encourage
            you to review these terms periodically.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.sectionText}>
            These terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict of law principles.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Open Source Software</Text>
          <Text style={styles.sectionText}>
            This App uses open source software licensed under the MIT License, including
            React Native, Expo, Supabase, Zustand, and other libraries. Full license terms
            are available at opensource.org/licenses/MIT.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactEmail}>jarrod@jandhtechnology.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Dad Jokes, you acknowledge that you have read, understood, and agree
            to be bound by these Terms of Service.
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
  lastUpdated: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 15,
    color: colors.primary.DEFAULT,
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
