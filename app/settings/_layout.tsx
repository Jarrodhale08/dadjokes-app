import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#EF4444',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="units" options={{ title: 'Units' }} />
      <Stack.Screen name="sync" options={{ title: 'Data Sync' }} />
      <Stack.Screen name="support" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
