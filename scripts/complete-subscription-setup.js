/**
 * Complete App Store Connect Subscription Setup
 * Adds prices and introductory offers to subscriptions
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
  return jwt.sign({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }, privateKey, {
    algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' }
  });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function apiCall(endpoint, options = {}) {
  // Add small delay to avoid rate limiting
  await sleep(500);

  // Generate fresh token for each call
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' },
    privateKey,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: KEY_ID, typ: 'JWT' } }
  );

  const url = endpoint.startsWith('http') ? endpoint : `https://api.appstoreconnect.apple.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

async function main() {
  console.log('=== App Store Connect Subscription Setup ===\n');
  console.log('App ID:', APP_ID);

  // Step 1: Get subscription groups
  console.log('\n--- Getting Subscription Groups ---');
  const groupsResult = await apiCall(`/v1/apps/${APP_ID}/subscriptionGroups`);

  if (!groupsResult.ok || !groupsResult.data.data?.length) {
    console.log('No subscription groups found');
    return;
  }

  const groupId = groupsResult.data.data[0].id;
  console.log('Subscription Group ID:', groupId);

  // Step 2: Get subscriptions
  console.log('\n--- Getting Subscriptions ---');
  const subsResult = await apiCall(`/v1/subscriptionGroups/${groupId}/subscriptions`);

  if (!subsResult.ok) {
    console.log('Error getting subscriptions:', subsResult.data);
    return;
  }

  const subscriptions = subsResult.data.data;
  console.log('Found', subscriptions.length, 'subscriptions:');

  for (const sub of subscriptions) {
    console.log(`\n  ${sub.attributes.productId}`);
    console.log(`  - ID: ${sub.id}`);
    console.log(`  - State: ${sub.attributes.state}`);
    console.log(`  - Duration: ${sub.attributes.subscriptionPeriod}`);
  }

  const monthlySub = subscriptions.find(s => s.attributes.productId === 'Pro_Dad_Jokes_Monthly');
  const annualSub = subscriptions.find(s => s.attributes.productId === 'Pro_Dad_Jokes_Annual');

  if (!monthlySub || !annualSub) {
    console.log('\nError: Could not find both subscriptions');
    return;
  }

  // Step 3: Check current prices
  console.log('\n--- Checking Current Prices ---');

  for (const sub of [monthlySub, annualSub]) {
    const pricesResult = await apiCall(`/v1/subscriptions/${sub.id}/prices`);
    console.log(`\n${sub.attributes.productId}:`);
    if (pricesResult.ok && pricesResult.data.data?.length > 0) {
      console.log('  Has', pricesResult.data.data.length, 'price(s) configured');
      for (const price of pricesResult.data.data) {
        console.log('  - Price ID:', price.id);
      }
    } else {
      console.log('  No prices configured yet');
    }
  }

  // Step 4: Get price points for USA (we need to find $2.99 and $19.99)
  console.log('\n--- Getting Price Points ---');

  // Get price points for monthly ($2.99)
  let monthlyPricePointId = null;
  let annualPricePointId = null;

  // Fetch all price points for each subscription
  const monthlyPPResult = await apiCall(`/v1/subscriptions/${monthlySub.id}/pricePoints?filter[territory]=USA&limit=200`);
  const annualPPResult = await apiCall(`/v1/subscriptions/${annualSub.id}/pricePoints?filter[territory]=USA&limit=200`);

  if (monthlyPPResult.ok && monthlyPPResult.data.data) {
    // Look for $2.99 (customerPrice around 2.99)
    for (const pp of monthlyPPResult.data.data) {
      const price = parseFloat(pp.attributes.customerPrice);
      if (price >= 2.98 && price <= 3.00) {
        monthlyPricePointId = pp.id;
        console.log('Found Monthly price point ($2.99):', monthlyPricePointId);
        break;
      }
    }
    if (!monthlyPricePointId) {
      // List some prices to debug
      console.log('Monthly price points sample:');
      for (let i = 0; i < Math.min(10, monthlyPPResult.data.data.length); i++) {
        const pp = monthlyPPResult.data.data[i];
        console.log(`  $${pp.attributes.customerPrice} - ID: ${pp.id}`);
      }
    }
  }

  if (annualPPResult.ok && annualPPResult.data.data) {
    // Look for $19.99
    for (const pp of annualPPResult.data.data) {
      const price = parseFloat(pp.attributes.customerPrice);
      if (price >= 19.98 && price <= 20.00) {
        annualPricePointId = pp.id;
        console.log('Found Annual price point ($19.99):', annualPricePointId);
        break;
      }
    }
    if (!annualPricePointId) {
      console.log('Annual price points sample:');
      for (let i = 0; i < Math.min(10, annualPPResult.data.data.length); i++) {
        const pp = annualPPResult.data.data[i];
        console.log(`  $${pp.attributes.customerPrice} - ID: ${pp.id}`);
      }
    }
  }

  // Step 5: Add prices if we found price points
  console.log('\n--- Adding Prices ---');

  if (monthlyPricePointId) {
    console.log('\nAdding $2.99 price to Monthly subscription...');
    const addPriceResult = await apiCall('/v1/subscriptionPrices', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptionPrices',
          attributes: {
            startDate: null,
            preserveCurrentPrice: false
          },
          relationships: {
            subscription: {
              data: { type: 'subscriptions', id: monthlySub.id }
            },
            subscriptionPricePoint: {
              data: { type: 'subscriptionPricePoints', id: monthlyPricePointId }
            }
          }
        }
      })
    });

    if (addPriceResult.ok) {
      console.log('  SUCCESS: Monthly price added');
    } else if (addPriceResult.status === 409) {
      console.log('  Price already exists');
    } else {
      console.log('  Error:', addPriceResult.status, JSON.stringify(addPriceResult.data));
    }
  }

  if (annualPricePointId) {
    console.log('\nAdding $19.99 price to Annual subscription...');
    const addPriceResult = await apiCall('/v1/subscriptionPrices', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptionPrices',
          attributes: {
            startDate: null,
            preserveCurrentPrice: false
          },
          relationships: {
            subscription: {
              data: { type: 'subscriptions', id: annualSub.id }
            },
            subscriptionPricePoint: {
              data: { type: 'subscriptionPricePoints', id: annualPricePointId }
            }
          }
        }
      })
    });

    if (addPriceResult.ok) {
      console.log('  SUCCESS: Annual price added');
    } else if (addPriceResult.status === 409) {
      console.log('  Price already exists');
    } else {
      console.log('  Error:', addPriceResult.status, JSON.stringify(addPriceResult.data));
    }
  }

  // Step 6: Add introductory offers (7-day free trial)
  console.log('\n--- Adding Introductory Offers (7-day free trial) ---');

  for (const sub of [monthlySub, annualSub]) {
    console.log(`\nAdding free trial to ${sub.attributes.productId}...`);

    // First check if intro offer already exists
    const existingOffersResult = await apiCall(`/v1/subscriptions/${sub.id}/introductoryOffers`);
    if (existingOffersResult.ok && existingOffersResult.data.data?.length > 0) {
      console.log('  Introductory offer already exists');
      continue;
    }

    // Get a price point for the territory (any price point will work for free trial)
    const pricePointId = sub === monthlySub ? monthlyPricePointId : annualPricePointId;

    if (!pricePointId) {
      console.log('  No price point available, skipping');
      continue;
    }

    const addOfferResult = await apiCall('/v1/subscriptionIntroductoryOffers', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'subscriptionIntroductoryOffers',
          attributes: {
            duration: 'ONE_WEEK',
            offerMode: 'FREE_TRIAL',
            numberOfPeriods: 1
          },
          relationships: {
            subscription: {
              data: { type: 'subscriptions', id: sub.id }
            },
            territory: {
              data: { type: 'territories', id: 'USA' }
            },
            subscriptionPricePoint: {
              data: { type: 'subscriptionPricePoints', id: pricePointId }
            }
          }
        }
      })
    });

    if (addOfferResult.ok) {
      console.log('  SUCCESS: Free trial added');
    } else if (addOfferResult.status === 409) {
      console.log('  Free trial already exists');
    } else {
      console.log('  Error:', addOfferResult.status, JSON.stringify(addOfferResult.data));
    }
  }

  // Step 7: Final status check
  console.log('\n--- Final Status Check ---');

  const finalSubsResult = await apiCall(`/v1/subscriptionGroups/${groupId}/subscriptions`);
  if (finalSubsResult.ok) {
    for (const sub of finalSubsResult.data.data) {
      console.log(`\n${sub.attributes.productId}:`);
      console.log(`  State: ${sub.attributes.state}`);
    }
  }

  console.log('\n=== Setup Complete ===');
  console.log('\nNote: If subscriptions still show MISSING_METADATA, you may need to:');
  console.log('1. Add localizations (display name, description)');
  console.log('2. Add a review screenshot in App Store Connect');
  console.log('3. Wait for changes to propagate');
}

main().catch(console.error);
