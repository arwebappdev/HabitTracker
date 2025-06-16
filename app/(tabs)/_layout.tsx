import { useAuth } from "@/lib/auth-context"; // Import authentication context
import AntDesign from "@expo/vector-icons/AntDesign"; // Icon set used for unfocused tab icon
import Entypo from "@expo/vector-icons/Entypo"; // Icon set used for focused tab icon
import { Tabs } from "expo-router"; // Expo Router Tabs component for navigation

export default function TabsLayout() {
  const { user } = useAuth(); // Access the authenticated user from context

  return (
    // Main Tabs layout container
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "blue", // Set active tab color to blue
      }}
    >
      {/* Home Screen Tab Configuration */}
      <Tabs.Screen
        name="index" // Corresponds to app/(tabs)/index.tsx
        options={{
          title: "Home", // Tab label
          tabBarIcon: ({ color, focused }) =>
            // Render icon based on tab focus
            focused ? (
              <Entypo name="home" size={24} color={color} /> // If focused, use filled home icon
            ) : (
              <AntDesign name="home" size={24} color={color} /> // If not focused, use outlined home icon
            ),
        }}
      />
    </Tabs>
  );
}
