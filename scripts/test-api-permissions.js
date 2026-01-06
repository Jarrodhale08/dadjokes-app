/**
 * Test App Store Connect API permissions
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

console.log('Testing API access...\n');
console.log('Credentials:');
console.log('  ISSUER_ID:', ISSUER_ID);
console.log('  KEY_ID:', KEY_ID);
console.log('  APP_ID:', APP_ID);
console.log('');

async function testEndpoint(name, url) {
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' },
    privateKey,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
  );

  console.log(`Testing: ${name}`);
  console.log(`  URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    console.log(`  Status: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`);

    if (response.ok && data.data) {
      if (Array.isArray(data.data)) {
        console.log(`  Results: ${data.data.length} items`);
        if (data.data[0]) {
          console.log(`  First item ID: ${data.data[0].id}`);
        }
      } else {
        console.log(`  Item ID: ${data.data.id}`);
      }
    } else if (!response.ok) {
      console.log(`  Error: ${data.errors?.[0]?.detail || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
  console.log('');
}

async function main() {
  // Test basic app access
  await testEndpoint('App Info', `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}`);

  // Wait between calls
  await new Promise(r => setTimeout(r, 1000));

  // Test subscription groups via app
  await testEndpoint('Subscription Groups', `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/subscriptionGroups`);

  await new Promise(r => setTimeout(r, 1000));

  // Test direct subscription group access (group ID from earlier: 21879966)
  await testEndpoint('Subscription Group Direct', `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/21879966`);

  await new Promise(r => setTimeout(r, 1000));

  // Test subscriptions endpoint
  await testEndpoint('Subscriptions in Group', `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/21879966/subscriptions`);

  await new Promise(r => setTimeout(r, 1000));

  // Test in-app purchases
  await testEndpoint('In-App Purchases v2', `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/inAppPurchasesV2`);
}

main().catch(console.error);
