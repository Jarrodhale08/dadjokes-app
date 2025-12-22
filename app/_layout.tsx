import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "../global.css";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      onError: (error) => {
        if ("message" in error) {
          console.error(error.message);
        }
      },
    },
  },
});

interface DrawerLinkProps {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

const DrawerLink = ({ href, label, icon, onPress }: DrawerLinkProps) => (
  <Link href={href as any} onPress={onPress} asChild>
    <TouchableOpacity style={styles.drawerItem}>
      <Ionicons name={icon} size={24} color="#EF4444" style={styles.drawerIcon} />
      <Text style={styles.drawerLabel}>{label}</Text>
    </TouchableOpacity>
  </Link>
);

const RootLayout = () => {
  const segments = useSegments();
  const currentScreen = segments[segments.length - 1] || "Dashboard";
  const drawerTitle = currentScreen === "(tabs)" ? "Dashboard" :
    currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1);

  return (
    <QueryClientProvider client={client}>
      <Drawer
        drawerContent={(props) => {
          return (
            <DrawerContentScrollView {...props} style={styles.drawerContent}>
              <View style={styles.drawerHeader}>
                <Ionicons name="apps" size={40} color="#EF4444" />
                <Text style={styles.appTitle}>DadJokes</Text>
              </View>

              <View style={styles.drawerItems}>
                <DrawerLink
                  href="/(tabs)/index"
                  label="Home"
                  icon="home"
                  onPress={() => props.navigation.closeDrawer()}
                />
                <DrawerLink
                  href="/(tabs)/profile"
                  label="Profile"
                  icon="person"
                  onPress={() => props.navigation.closeDrawer()}
                />
                <DrawerLink
                  href="/(tabs)/settings"
                  label="Settings"
                  icon="settings"
                  onPress={() => props.navigation.closeDrawer()}
                />
              </View>
            </DrawerContentScrollView>
          );
        }}
        screenOptions={{
          title: drawerTitle,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
          drawerPosition: 'right',
          headerLeft: () => null,
        }}
      />
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  drawerItems: {
    paddingHorizontal: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  drawerIcon: {
    marginRight: 16,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});

export default RootLayout;
