import { Colors } from "@/constants/colors";
import "@/global.css";
import { SessionProvider, useSession } from "@/utils/auth-context";
// import { clearBadgeCount } from "@/utils/notifications";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";


// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  useEffect(() => {
    // initializeRevenueCat();
  }, []);

  return (
    <SessionProvider>
      <GestureHandlerRootView>
        <KeyboardProvider preload={false}>
          <ThemeProvider value={DefaultTheme}>
            <RootNavigator />
            <StatusBar style="dark" />
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SessionProvider>
  );
}

// Componente separado que puede acceder al SessionProvider context
function RootNavigator() {
  const { session, isLoading } = useSession();

  useEffect(() => {
    // Ocultar splash screen cuando termine de cargar
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Refresh notifications when user is logged in and app comes to foreground
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!session || isLoading) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // App came to foreground (from background or inactive)
      const wasInBackground = appState.current === "inactive" || appState.current === "background";

      if (wasInBackground && nextAppState === "active") {
        // clearBadgeCount();
      }
      appState.current = nextAppState;
    };

    // Also run on initial mount when user is logged in
    // clearBadgeCount();

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [session, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "flip",
        animationDuration: 250,
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Protected guard={session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade", animationDuration: 250 }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(onboarding)/step-1" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/step-2" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/step-3" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/step-4" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/step-5" options={{ headerShown: false }} />
        {/* <Stack.Screen name="(onboarding)/step-6" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/auth" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)/email-otp" options={{ headerShown: false }} /> */}
      </Stack.Protected>
    </Stack>
  );
}
