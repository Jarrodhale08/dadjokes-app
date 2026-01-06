# RevenueCat Setup Guide - DadJokes

This guide will walk you through setting up RevenueCat for in-app purchases and subscription management in the DadJokes app.

## Overview

DadJokes uses RevenueCat to manage subscriptions across iOS and Android platforms. This includes:
- 7-day free trial
- Monthly subscription ($2.99/month)
- Yearly subscription ($19.99/year - Save 44%)
- Premium entitlement: `dadjokes_pro`
- iOS Product IDs: `Pro_Dad_Jokes_Monthly`, `Pro_Dad_Jokes_Annual`

## Prerequisites

- [ ] App published on App Store Connect (iOS)
- [ ] App published on Google Play Console (Android)
- [ ] RevenueCat account created at [app.revenuecat.com](https://app.revenuecat.com)

---

## Step 1: RevenueCat Dashboard Setup

### 1.1 Create Project

1. Log in to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Click **Create New Project**
3. Project Name: `DadJokes`
4. Click **Create**

### 1.2 Get API Keys

1. Go to **Project Settings** → **API Keys**
2. Copy your **Public API Key**
3. Add to your `.env` file:

```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=your_public_api_key_here
```

**IMPORTANT:** Never commit your actual API key to git. The `.env` file is gitignored.

---

## Step 2: iOS App Store Setup

### 2.1 Create Subscription Group

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Apps** → **DadJokes** → **In-App Purchases**
3. Click **Manage** under Subscriptions
4. Click **+** to create a new Subscription Group
5. Group Name: `DadJokes Premium`
6. Click **Create**

### 2.2 Create Subscription Products

Create these three subscription products:

#### Monthly Subscription
- **Product ID:** `Pro_Dad_Jokes_Monthly`
- **Reference Name:** DadJokes Monthly
- **Subscription Duration:** 1 Month
- **Price:** $2.99 USD
- **Introductory Offer:**
  - Type: Free Trial
  - Duration: 7 Days
  - Free

#### Yearly Subscription
- **Product ID:** `Pro_Dad_Jokes_Annual`
- **Reference Name:** DadJokes Yearly
- **Subscription Duration:** 1 Year
- **Price:** $19.99 USD
- **Introductory Offer:**
  - Type: Free Trial
  - Duration: 7 Days
  - Free

#### Lifetime Purchase (Optional)
- **Product ID:** `Pro_Dad_Jokes_Lifetime`
- **Reference Name:** DadJokes Lifetime
- **Type:** Non-Consumable In-App Purchase
- **Price:** $49.99 USD

### 2.3 Submit for Review

1. Fill in all required metadata (name, description)
2. Upload required screenshots (if needed)
3. Submit products for review

---

## Step 3: Android Google Play Setup

### 3.1 Create Subscription Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Apps** → **DadJokes** → **Monetize** → **Subscriptions**
3. Click **Create subscription**

#### Monthly Subscription
- **Product ID:** `Pro_Dad_Jokes_Monthly`
- **Name:** DadJokes Premium Monthly
- **Description:** Monthly access to all premium dad jokes features
- **Billing period:** Monthly (1 month)
- **Price:** $2.99 USD
- **Free trial:** 7 days

#### Yearly Subscription
- **Product ID:** `Pro_Dad_Jokes_Annual`
- **Name:** DadJokes Premium Yearly
- **Description:** Yearly access to all premium dad jokes features (Save 44%)
- **Billing period:** Yearly (12 months)
- **Price:** $19.99 USD
- **Free trial:** 7 days

### 3.2 Activate Subscriptions

1. Click **Activate** on each subscription
2. Subscriptions must be active before testing

---

## Step 4: Connect Stores to RevenueCat

### 4.1 iOS Configuration

1. In RevenueCat Dashboard, go to **Project Settings** → **App**
2. Select your project
3. Click **iOS App**
4. Enter your **Bundle ID:** `com.dadjokes.app`
5. Upload **App Store Connect API Key:**
   - Go to App Store Connect → Users and Access → Keys
   - Generate new API key with App Manager role
   - Download `.p8` file
   - Upload to RevenueCat
6. Click **Save**

### 4.2 Android Configuration

1. In RevenueCat Dashboard, go to **Project Settings** → **App**
2. Click **Android App**
3. Enter your **Package Name:** `com.dadjokes.app`
4. Upload **Google Play Service Credentials:**
   - Go to Google Play Console → Setup → API access
   - Create new service account
   - Grant necessary permissions
   - Download JSON credentials file
   - Upload to RevenueCat
5. Click **Save**

---

## Step 5: Create Products in RevenueCat

### 5.1 Import Products

1. Go to **Products** in RevenueCat Dashboard
2. Click **+ New** → **Import from App Store**
3. Select all products:
   - `Pro_Dad_Jokes_Monthly`
   - `Pro_Dad_Jokes_Annual`
   - `Pro_Dad_Jokes_Lifetime` (if created)
4. Click **Import**

### 5.2 Verify Products

Ensure products show:
- ✅ Available on iOS
- ✅ Available on Android
- ✅ 7-day free trial configured

---

## Step 6: Create Entitlement

### 6.1 Create Entitlement

1. Go to **Entitlements** in RevenueCat Dashboard
2. Click **+ New Entitlement**
3. **Identifier:** `dadjokes_pro`
4. **Display Name:** DadJokes Pro
5. Click **Save**

### 6.2 Attach Products to Entitlement

1. Select `dadjokes_pro` entitlement
2. Click **Attach Products**
3. Select all products:
   - `Pro_Dad_Jokes_Monthly`
   - `Pro_Dad_Jokes_Annual`
   - `Pro_Dad_Jokes_Lifetime` (if created)
4. Click **Attach**

---

## Step 7: Create Offering

### 7.1 Create Default Offering

1. Go to **Offerings** in RevenueCat Dashboard
2. Click **+ New Offering**
3. **Identifier:** `default`
4. **Display Name:** Default Offering
5. Click **Save**

### 7.2 Add Packages to Offering

Add the following packages:

#### Package 1: Monthly
- **Identifier:** `monthly`
- **Product:** `Pro_Dad_Jokes_Monthly`
- **Position:** 1

#### Package 2: Yearly (Recommended)
- **Identifier:** `annual`
- **Product:** `Pro_Dad_Jokes_Annual`
- **Position:** 0 (shows first)

#### Package 3: Lifetime (Optional)
- **Identifier:** `lifetime`
- **Product:** `Pro_Dad_Jokes_Lifetime`
- **Position:** 2

### 7.3 Set as Current Offering

1. Click **Make Current** on the default offering
2. This makes it available to users

---

## Step 8: Design Paywall (Optional but Recommended)

### 8.1 Use RevenueCat Paywall Builder

1. Go to **Paywalls** in RevenueCat Dashboard
2. Click **+ New Paywall**
3. Choose a template or start from scratch
4. Customize:
   - Colors to match app theme (Teal #14B8A6, Dark #111827)
   - Add dad joke themed images
   - Highlight 7-day free trial
5. Attach to default offering
6. Click **Save**

---

## Step 9: Testing

### 9.1 iOS Sandbox Testing

1. Go to App Store Connect → Users and Access → Sandbox Testers
2. Create a new sandbox tester account
3. On your iOS device:
   - Sign out of App Store
   - Run the app
   - When prompted for subscription, sign in with sandbox account
4. Test:
   - [ ] Free trial starts correctly
   - [ ] Premium features unlock
   - [ ] Trial expiration works
   - [ ] Subscription renewal works

### 9.2 Android License Testing

1. Go to Google Play Console → Setup → License Testing
2. Add your Gmail account to testers list
3. On your Android device:
   - Use the tester Gmail account
   - Run the app from internal testing track
4. Test:
   - [ ] Free trial starts correctly
   - [ ] Premium features unlock
   - [ ] Trial expiration works
   - [ ] Subscription renewal works

### 9.3 RevenueCat Dashboard Verification

1. Go to **Customers** in RevenueCat Dashboard
2. Verify test purchases appear
3. Check entitlements are granted correctly

---

## Step 10: Production Deployment

### 10.1 Pre-Launch Checklist

- [ ] All products approved in App Store Connect
- [ ] All products activated in Google Play Console
- [ ] RevenueCat configured for both platforms
- [ ] Entitlements and offerings set up correctly
- [ ] Paywall tested on both platforms
- [ ] `.env` file contains production RevenueCat API key
- [ ] App submitted to stores with in-app purchase capability

### 10.2 Go Live

1. Submit app for App Store review
2. Submit app for Google Play review
3. Once approved, monitor RevenueCat Dashboard for:
   - Trial starts
   - Conversions
   - Revenue
   - Churn

---

## Troubleshooting

### "No offerings found"

**Solution:**
1. Verify products are imported in RevenueCat
2. Check offering is set as "Current"
3. Ensure products are attached to offering
4. Wait 5-10 minutes for RevenueCat cache to update

### "Invalid API key"

**Solution:**
1. Verify `.env` file contains correct API key
2. Check for quotes or extra spaces in `.env`
3. Restart Metro bundler: `npx expo start --clear`
4. Rebuild app

### Free trial not showing

**Solution:**
1. Verify introductory offer configured in App/Play Store
2. Check user hasn't already used trial (RevenueCat tracks this)
3. Ensure product has intro price in RevenueCat dashboard

### Restore purchases not working

**Solution:**
1. Verify user is signed in with same Apple/Google account
2. Check RevenueCat logs for errors
3. Ensure app has correct bundle ID / package name
4. Try signing out and back in to App/Play Store

---

## Support

### RevenueCat Documentation
- [Getting Started](https://docs.revenuecat.com/docs)
- [iOS Guide](https://docs.revenuecat.com/docs/ios)
- [Android Guide](https://docs.revenuecat.com/docs/android)
- [React Native SDK](https://docs.revenuecat.com/docs/reactnative)

### Contact
- RevenueCat Support: support@revenuecat.com
- Community Slack: [revenuecat.com/slack](https://www.revenuecat.com/slack)

---

## Next Steps

After completing this setup:

1. **Test thoroughly** on both platforms with sandbox/test accounts
2. **Monitor analytics** in RevenueCat Dashboard
3. **Optimize conversion** by testing different paywall designs
4. **Analyze churn** and adjust pricing/features as needed

Your subscription system is now ready for production! 🎉
