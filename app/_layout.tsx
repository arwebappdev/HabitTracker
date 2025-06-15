import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const isAuth = false; // Replace with real auth logic

  useEffect(() => {
    // Only run redirect after first mount
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady && !isAuth) {
      router.replace("/auth");
    }
  }, [isReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <RouteGuard>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </RouteGuard>
  );
}
