/**
 * Update App Store Connect Subscription Metadata
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load credentials
const envPath = path.join(__dirname, '../fastlane/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const ISSUER_ID = env.APP_STORE_CONNECT_ISSUER_ID;
const KEY_ID = env.APP_STORE_CONNECT_KEY_ID;
const APP_ID = env.APP_STORE_APP_ID || env.ASC_APP_ID;

const privateKeyPath = path.join(__dirname, '../fastlane/AuthKey_' + KEY_ID + '.p8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' },
    privateKey,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
  );
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const token = generateJWT();
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`https://api.appstoreconnect.apple.com${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    console.error('API Error:', JSON.stringify(data, null, 2));
    return null;
  }
  return data;
}

async function getSubscriptions() {
  console.log('Fetching subscription groups...');
  const groups = await apiCall(`/v1/apps/${APP_ID}/subscriptionGroups`);
  if (!groups || !groups.data.length) {
    console.log('No subscription groups found');
    return [];
  }

  const subscriptions = [];
  for (const group of groups.data) {
    console.log(`\nGroup: ${group.attributes.referenceName}`);
    const subs = await apiCall(`/v1/subscriptionGroups/${group.id}/subscriptions`);
    if (subs && subs.data) {
      for (const sub of subs.data) {
        subscriptions.push({
          id: sub.id,
          productId: sub.attributes.productId,
          name: sub.attributes.name,
          state: sub.attributes.state,
          groupId: group.id
        });
        console.log(`  - ${sub.attributes.productId}: ${sub.attributes.state}`);
      }
    }
  }
  return subscriptions;
}

async function addSubscriptionLocalization(subscriptionId, productId) {
  console.log(`\nAdding localization for ${productId}...`);
  
  const displayName = productId.includes('Annual') ? 'Annual Premium' : 'Monthly Premium';
  const description = productId.includes('Annual') 
    ? 'Full year of premium access to all dad jokes. Best value - save 44%!'
    : 'Monthly premium access to the full dad jokes library and all features.';

  const body = {
    data: {
      type: 'subscriptionLocalizations',
      attributes: {
        name: displayName,
        description: description,
        locale: 'en-US'
      },
      relationships: {
        subscription: {
          data: { type: 'subscriptions', id: subscriptionId }
        }
      }
    }
  };

  const result = await apiCall('/v1/subscriptionLocalizations', 'POST', body);
  if (result) {
    console.log(`  Localization added: ${displayName}`);
    return true;
  }
  return false;
}

async function checkSubscriptionPrices(subscriptionId) {
  console.log(`Checking prices for subscription ${subscriptionId}...`);
  const prices = await apiCall(`/v1/subscriptions/${subscriptionId}/prices`);
  if (prices && prices.data && prices.data.length > 0) {
    console.log(`  Has ${prices.data.length} price(s) configured`);
    return true;
  }
  console.log('  No prices configured');
  return false;
}

async function getSubscriptionDetails(subscriptionId) {
  const details = await apiCall(`/v1/subscriptions/${subscriptionId}?include=subscriptionLocalizations,prices,introductoryOffers`);
  return details;
}

async function main() {
  console.log('=== App Store Connect Subscription Update ===\n');
  
  const subscriptions = await getSubscriptions();
  
  if (subscriptions.length === 0) {
    console.log('\nNo subscriptions to update');
    return;
  }

  console.log('\n=== Checking/Adding Localizations ===');
  
  for (const sub of subscriptions) {
    // Check if localization exists
    const details = await getSubscriptionDetails(sub.id);
    const hasLocalization = details?.included?.some(i => i.type === 'subscriptionLocalizations');
    
    if (!hasLocalization) {
      await addSubscriptionLocalization(sub.id, sub.productId);
    } else {
      console.log(`\n${sub.productId}: Already has localization`);
    }
    
    // Check prices
    await checkSubscriptionPrices(sub.id);
  }

  console.log('\n=== Summary ===');
  console.log('Localizations have been added where missing.');
  console.log('\nMANUAL STEPS STILL REQUIRED in App Store Connect:');
  console.log('1. Set subscription prices ($2.99/month, $19.99/year)');
  console.log('2. Add 7-day free trial introductory offer');
  console.log('3. Submit subscriptions for review');
  console.log('\nThese cannot be done via API - must use App Store Connect web interface.');
}

main().catch(console.error);
