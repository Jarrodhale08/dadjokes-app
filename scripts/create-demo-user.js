/**
 * Create Demo User for App Store Review
 *
 * This script creates a demo user in Supabase Auth that can be used
 * for App Store review. The same account works across all apps using
 * this Supabase project.
 *
 * Run: node scripts/create-demo-user.js
 */

const { createClient } = require('@supabase/supabase-js');

// Demo credentials - same across all apps
const DEMO_EMAIL = 'demo@jandhtechnology.com';
const DEMO_PASSWORD = 'AppReview2026!';

// Supabase config from .env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://kazhissaknwmagcribxq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthemhpc3Nha253bWFnY3JpYnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTUxNzksImV4cCI6MjA4MTkzMTE3OX0.XbnDe0ZRip3zZh1SRE4Smk82hx1kyy0NSASsFHG5X5c';

async function createDemoUser() {
  console.log('Creating demo user for App Store review...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Try to sign up the demo user
    const { data, error } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      options: {
        data: {
          display_name: 'Demo User',
          is_demo_account: true,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('Demo user already exists!');
        console.log(`Email: ${DEMO_EMAIL}`);
        console.log(`Password: ${DEMO_PASSWORD}`);
        console.log('\nYou can use these credentials for App Store review.');
        return;
      }
      throw error;
    }

    console.log('Demo user created successfully!');
    console.log(`Email: ${DEMO_EMAIL}`);
    console.log(`Password: ${DEMO_PASSWORD}`);
    console.log(`User ID: ${data.user?.id}`);
    console.log('\nIMPORTANT: Go to Supabase Dashboard > Authentication > Users');
    console.log('and confirm the email for this user (or disable email confirmation).');
    console.log('\nThese credentials are stored in:');
    console.log('- fastlane/metadata/review_information/demo_user.txt');
    console.log('- fastlane/metadata/review_information/demo_password.txt');

  } catch (err) {
    console.error('Error creating demo user:', err.message);
    console.log('\nAlternative: Create the user manually in Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication > Users');
    console.log('4. Click "Add User" > "Create New User"');
    console.log(`5. Email: ${DEMO_EMAIL}`);
    console.log(`6. Password: ${DEMO_PASSWORD}`);
    console.log('7. Check "Auto Confirm User"');
  }
}

createDemoUser();
