import { useAuth } from "@/lib/auth-context"; // Import authentication context
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Icon set used for focused tab icon
import { Tabs } from "expo-router"; // Expo Router Tabs component for navigation
import { useTheme } from "react-native-paper";

export default function TabsLayout() {
  const { user } = useAuth(); // Access the authenticated user from context
  const theme = useTheme();
  return (
    // Main Tabs layout container
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary, // Set active tab color to blue
        headerShown: false,
      }}
    >
      {/* Home Screen Tab Configuration */}
      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          title: "Today's Habits", // Tab label
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="calendar-today"
              size={30}
              color={color}
            />
          ),
        }}
      />

      {/* Streaks Tab Configuration */}
      <Tabs.Screen
        name="streaks" // Corresponds to app/(tabs)/streaks.tsx
        options={{
          title: "Streaks", // Tab label
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="chart-line" size={30} color={color} />
          ),
        }}
      />
      {/*Add Habit tab configuration */}
      <Tabs.Screen
        name="add-habit" // Corresponds to app/(tabs)/add-habit.tsx
        options={{
          title: "Add Habit", // Tab label
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="plus-circle"
              size={30}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
