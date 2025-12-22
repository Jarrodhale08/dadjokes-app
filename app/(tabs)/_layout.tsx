import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";

/**
 * Tab Layout - Dad Jokes Dark Theme
 * Primary color: Yellow/Gold (#FACC15)
 */
const RouterTabs = () => {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.DEFAULT,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jokes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hidden from tab bar - accessed from settings
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
    </Tabs>
  );
};

export default RouterTabs;
