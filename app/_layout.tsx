import { Colors } from "@/constants/colors";
import "@/global.css";
import { SessionProvider, useSession } from "@/utils/auth-context";
import { OnboardingProvider } from "@/utils/onboarding-context";
import { getBiometricEnabled, hasCompletedOnboarding } from "@/utils/storage";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Pressable, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { clearBadgeCount } from "@/utils/notifications";
import { initializeRevenueCat } from "@/utils/revenue-cat";
import { SubscriptionProvider } from "@/utils/subscription-context";

//TODO WHEN APP PUBLISHED: https://docs.swmansion.com/detour/docs/SDK/sdk-usage

// Time in seconds before requiring authentication after backgrounding
const LOCK_TIMEOUT_SECONDS = 30;

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // State for blur - shown when app is not in foreground
  const [showBlur, setShowBlur] = useState(false);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { content } = response.notification.request;
      const { data = null } = content;
      console.log('data:', data);
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  // Immediate blur when app loses focus (for multitasking)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Show blur immediately when not in active state
      setShowBlur(nextAppState !== "active");
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <SessionProvider>
      <OnboardingProvider>
        <SubscriptionProvider>
          <GestureHandlerRootView>
            <KeyboardProvider preload={false}>
              <ThemeProvider value={DefaultTheme}>
                <RootNavigator showBlur={showBlur} setShowBlur={setShowBlur} />
                <StatusBar style="dark" />
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SubscriptionProvider>
      </OnboardingProvider>
    </SessionProvider>
  );
}

// Separate component that can access SessionProvider context
function RootNavigator({ showBlur, setShowBlur }: { showBlur: boolean; setShowBlur: (value: boolean) => void }) {
  const { session, isLoading } = useSession();

  const [hasSecurityEnabled, setHasSecurityEnabled] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // True when authentication is required
  const lastBackgroundTime = useRef<number | null>(null);
  const hasCheckedSecurity = useRef(false);
  const isAuthenticating = useRef(false);
  const appState = useRef(AppState.currentState);

  // Authenticate with biometrics automatically
  const authenticate = async () => {
    if (isAuthenticating.current) return;
    isAuthenticating.current = true;
    setIsLocked(true);

    const biometricEnabled = await getBiometricEnabled();

    if (biometricEnabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Onefolio",
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false, // Allow passcode fallback after Face ID fails
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Remove blur immediately after successful authentication
        setIsLocked(false);
        setShowBlur(false);
      }
      // If failed/cancelled, stay locked - user can tap to retry
    } else {
      setIsLocked(false);
      setShowBlur(false);
    }

    isAuthenticating.current = false;
  };

  // Check security settings on mount
  useEffect(() => {
    const checkSecuritySettings = async () => {
      const completed = await hasCompletedOnboarding();
      setOnboardingCompleted(completed);

      if (!completed) return;

      const biometricEnabled = await getBiometricEnabled();
      setHasSecurityEnabled(biometricEnabled);

      // Authenticate on first load if security is enabled
      if (biometricEnabled && !hasCheckedSecurity.current) {
        hasCheckedSecurity.current = true;
        authenticate();
      }
    };

    if (!isLoading) {
      checkSecuritySettings();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Handle app state changes for re-authentication
  useEffect(() => {
    if (isLoading) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Only save time when actually going to background (not inactive)
      if (nextAppState === "background") {
        lastBackgroundTime.current = Date.now();
      }

      const wasInBackground = appState.current === "background";

      // Only request Face ID when returning from actual background (not from inactive)
      if (wasInBackground && nextAppState === "active") {
        if (onboardingCompleted && hasSecurityEnabled && lastBackgroundTime.current) {
          const timeSinceBackground = (Date.now() - lastBackgroundTime.current) / 1000;
          // Only authenticate if was in background long enough AND not already locked
          // If already locked, don't re-trigger (user might have cancelled)
          if (timeSinceBackground >= LOCK_TIMEOUT_SECONDS && !isLocked) {
            authenticate();
          }
          // If already locked, stay locked - user needs to authenticate
          // If returned quickly and not locked, stay unlocked
        }
      }

      appState.current = nextAppState;
    };

    // Also run on initial mount when user is logged in
    clearBadgeCount();

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isLoading, hasSecurityEnabled, onboardingCompleted, isLocked]);

  if (isLoading) {
    return null;
  }

  // Show blur if:
  // 1. App is not in foreground (showBlur from parent) AND has security enabled
  // 2. Or is locked (authentication pending/failed)
  const shouldShowBlur = (showBlur && hasSecurityEnabled && onboardingCompleted) || isLocked;

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "flip",
          animationDuration: 250,
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Protected guard={session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade", animationDuration: 250 }} />
          <Stack.Screen name="account-settings" options={{ headerShown: false }} />
          <Stack.Screen name="currency-settings" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="account-menu" options={{ headerShown: false }} />
          <Stack.Screen name="risk-profile-settings" options={{ headerShown: false }} />
          <Stack.Screen name="financial-plan-settings" options={{ headerShown: false }} />
          <Stack.Screen name="asset-detail" options={{ headerShown: false }} />
          <Stack.Screen name="select-asset-type" options={{ headerShown: false }} />
          <Stack.Screen name="add-asset" options={{ headerShown: false, presentation: "modal", animation: "default", gestureEnabled: false }} />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="(onboarding)/welcome" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-1" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-2" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-3" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-4" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-5" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-6" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-7" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-8" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/step-9" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)/add-asset" options={{ headerShown: false, presentation: "modal", animation: "default", gestureEnabled: false }} />
        </Stack.Protected>
      </Stack>

      {/* Security blur overlay */}
      {shouldShowBlur && (
        <Pressable
          onPress={() => {
            // If locked and not currently authenticating, retry authentication
            if (isLocked && !isAuthenticating.current) {
              authenticate();
            }
          }}
          className="absolute inset-0 z-50"
        >
          <BlurView
            intensity={50}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            className="flex-1"
          />
        </Pressable>
      )}
    </View>
  );
}