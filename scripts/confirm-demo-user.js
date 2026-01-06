/**
 * Confirm Demo User Email in Supabase
 * Uses Supabase Management API to get service role key, then confirms user
 */

const SUPABASE_ACCESS_TOKEN = '***REMOVED***';
const PROJECT_REF = 'kazhissaknwmagcribxq'; // From the Supabase URL
const DEMO_USER_ID = '63801e39-4f70-44be-8aea-553a01f59928';

async function getServiceRoleKey() {
  console.log('Getting service role key from Supabase Management API...');
  
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get API keys: ${response.status} - ${error}`);
  }

  const keys = await response.json();
  const serviceRoleKey = keys.find(k => k.name === 'service_role');
  
  if (!serviceRoleKey) {
    throw new Error('Service role key not found');
  }

  return serviceRoleKey.api_key;
}

async function confirmUser(serviceRoleKey) {
  console.log('Confirming demo user email...');
  
  const supabaseUrl = `https://${PROJECT_REF}.supabase.co`;
  
  // Update user to confirm email
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${DEMO_USER_ID}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_confirm: true
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to confirm user: ${response.status} - ${error}`);
  }

  const user = await response.json();
  console.log('User confirmed successfully!');
  console.log('Email:', user.email);
  console.log('Email Confirmed:', user.email_confirmed_at ? 'YES' : 'NO');
  return user;
}

async function main() {
  console.log('=== Confirming Demo User in Supabase ===\n');
  
  try {
    const serviceRoleKey = await getServiceRoleKey();
    console.log('Service role key obtained\n');
    
    await confirmUser(serviceRoleKey);
    
    console.log('\nDemo user is now ready for App Store review!');
    console.log('Email: demo@jandhtechnology.com');
    console.log('Password: AppReview2026!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
