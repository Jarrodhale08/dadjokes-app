/**
 * Check App Store Connect Subscriptions
 * Uses the App Store Connect API to verify subscription configuration
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Load credentials from fastlane/.env
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

// Read private key
const privateKeyPath = path.join(__dirname, '../fastlane/AuthKey_' + KEY_ID + '.p8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Generate JWT
function generateJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200, // 20 minutes
    aud: 'appstoreconnect-v1'
  };
  
  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' }
  });
}

async function checkSubscriptions() {
  const token = generateJWT();
  
  console.log('=== App Store Connect Subscription Check ===\n');
  console.log('App ID:', APP_ID);
  console.log('Issuer ID:', ISSUER_ID);
  console.log('Key ID:', KEY_ID);
  console.log('');

  try {
    // Get app info
    const appResponse = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!appResponse.ok) {
      const error = await appResponse.text();
      throw new Error(`App fetch failed: ${appResponse.status} - ${error}`);
    }
    
    const appData = await appResponse.json();
    console.log('App Name:', appData.data.attributes.name);
    console.log('Bundle ID:', appData.data.attributes.bundleId);
    console.log('');

    // Get subscription groups
    console.log('=== Subscription Groups ===\n');
    const subGroupsResponse = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/subscriptionGroups`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!subGroupsResponse.ok) {
      console.log('No subscription groups found or error fetching.');
      const subGroupsData = { data: [] };
    }
    
    const subGroupsData = await subGroupsResponse.json();
    
    if (subGroupsData.data.length === 0) {
      console.log('NO SUBSCRIPTION GROUPS CONFIGURED');
      console.log('\nAction Required: Create subscription group in App Store Connect');
      return;
    }

    for (const group of subGroupsData.data) {
      console.log(`Group: ${group.attributes.referenceName || group.id}`);
      
      // Get subscriptions in this group
      const subsResponse = await fetch(
        `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/${group.id}/subscriptions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        
        if (subsData.data.length === 0) {
          console.log('  No subscriptions in this group');
        } else {
          for (const sub of subsData.data) {
            console.log(`  - ${sub.attributes.name} (${sub.attributes.productId})`);
            console.log(`    State: ${sub.attributes.state}`);
            console.log(`    Review Note: ${sub.attributes.reviewNote || 'None'}`);
          }
        }
      }
      console.log('');
    }

    // Get in-app purchases too
    console.log('=== In-App Purchases ===\n');
    const iapResponse = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/inAppPurchasesV2`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (iapResponse.ok) {
      const iapData = await iapResponse.json();
      if (iapData.data.length === 0) {
        console.log('No in-app purchases configured');
      } else {
        for (const iap of iapData.data) {
          console.log(`- ${iap.attributes.name} (${iap.attributes.productId})`);
          console.log(`  Type: ${iap.attributes.inAppPurchaseType}`);
          console.log(`  State: ${iap.attributes.state}`);
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSubscriptions();
