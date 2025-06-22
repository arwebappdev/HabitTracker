import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

// This component handles route protection based on user's auth state
function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth(); // get auth state
  const segments = useSegments(); // get current route segments

  useEffect(() => {
    const isLoginRoute = segments[0] === "(auth)"; // check if user is in 'auth' route group

    // If user is not logged in and not on login/signup page, redirect to auth page
    if (!user && !isLoginRoute && !isLoadingUser) {
      router.replace("/(auth)/auth");
    }

    // If user is logged in and is on auth page, redirect to home
    else if (user && isLoginRoute && !isLoadingUser) {
      router.replace("/");
    }
  }, [user, segments, isLoadingUser]);

  // Render the app content only when auth state is properly checked
  return <>{children}</>;
}

// This is the root layout of your app
export default function RootLayout() {
  return (
    // Provide authentication context globally
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider>
          <SafeAreaProvider>
            {/* Apply route guard logic before rendering stack screens */}
            <RouteGuard>
              <Stack screenOptions={{ headerShown: false }}>
                {/* Main app screens are nested in (tabs) folder */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </RouteGuard>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
