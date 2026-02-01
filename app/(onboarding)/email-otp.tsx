import { Colors } from "@/constants/colors";
import { router, useLocalSearchParams } from "expo-router";
import React, { useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { TextInput } from "react-native";
import { hasCompletedOnboarding, setOnboardingCompleted, setUser } from "@/utils/storage";
import { useSession } from "@/utils/auth-context";
import { usersApi } from "@/utils/api/users";
import { useHaptics } from "@/hooks/haptics";
import { getCustomerInfo, setRevenueCatUserId } from "@/utils/revenue-cat";
import Icon from "react-native-remix-icon";
import * as Device from 'expo-device';

// ============================================================================
// Component
// ============================================================================

const NOTIFICATION_TIMES: readonly { id: number; title: string }[] = [
  {
    id: 1,
    title: "Morning",
  },
  {
    id: 2,
    title: "Afternoon",
  },
  {
    id: 3,
    title: "Evening",
  },
] as const;

export default function EmailOTP() {
  const { triggerHaptics } = useHaptics();
  const { signIn } = useSession();
  const codeInputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  const { name, email, firstCategoryChoice, notificationTime, languageCode, timeZone } = useLocalSearchParams<{
    otpCode: string;
    otpExpiresAt: string;
    name: string;
    email: string;
    firstCategoryChoice: string;
    notificationTime: string;
    languageCode: string;
    timeZone: string;
  }>();

  const checkOnboardingCompleted = async () => {
    const completedOnboarding = await hasCompletedOnboarding();
    setCompletedOnboarding(completedOnboarding);
  };

  useLayoutEffect(() => {
    checkOnboardingCompleted();
  }, []);

  const markOnboardingCompleted = async () => {
    const completedOnboarding = await hasCompletedOnboarding();
    if (!completedOnboarding) {
      await setOnboardingCompleted();
    }
  };

  const requestNewCode = async () => {
    try {
      codeInputRef.current?.clear();
      const apiResponse = await usersApi.sentEmailOTP({ email: email });
      if (apiResponse.message) {
      } else {
        throw new Error("Error requesting new code");
      }
    } catch (error) {
      console.error("Error requestNewCode: ", error);
      Alert.alert("Error", "An error occurred while requesting a new code. Please try again in a few minutes.", [{ text: "OK" }]);
    }
  };

  const validateCode = async () => {
    try {
      const apiResponse = await usersApi.verifyOtpCode({ email: email, code: code });
      if (apiResponse.message) {
        return true;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid verification code") {
          Alert.alert("Invalid Code", "The code you entered is not valid. Please check and try again.", [{ text: "OK" }]);
        } else if (error.message === "Verification code has expired") {
          Alert.alert("Code Expired", "Your verification code has expired. Would you like to request a new one?", [
            { text: "Cancel", style: "cancel" },
            { text: "Request New Code", onPress: requestNewCode },
          ]);
        } else {
          Alert.alert("Error", "An error occurred while validating the code. Please try again in a few minutes.", [{ text: "OK" }]);
        }
      } else {
        Alert.alert("Error", "An error occurred while validating the code. Please try again in a few minutes.", [{ text: "OK" }]);
      }
    }
    return false;
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    const isValid = await validateCode();
    if (!isValid) {
      triggerHaptics("Error");
      setIsLoading(false);
      return;
    }
    try {
      const user: any = {
        email: email,
        device: `${Device.manufacturer} ${Device.modelName}`
      };

      const customerInfo = await getCustomerInfo();
      if (customerInfo && customerInfo.originalAppUserId) {
        user.revenueCatId = customerInfo.originalAppUserId;
      }

      const apiResponse = await usersApi.signIn(user);
      if (apiResponse.user) {
        if (apiResponse.user.accessToken) {
          await markOnboardingCompleted();
          await setUser(apiResponse.user);
          await setRevenueCatUserId({ userId: apiResponse.user.id, email: apiResponse.user.email, firstName: apiResponse.user.firstName });
          await signIn();
          triggerHaptics("Success");
          router.replace({ pathname: "/(tabs)" });
        } else {
          router.replace({ pathname: "/(onboarding)/step-1", params: { name: apiResponse.user.firstName, email: apiResponse.user.email, } });
        }
      } else {
        throw new Error("Error signing with email");
      }
    } catch (error) {
      triggerHaptics("Error");
      console.error("Error handleSignIn: ", error);
      Alert.alert("Error", "An error occurred while verifying your code. Please try again.", [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 py-safe">
      {/* Header */}
      <View className="px-5 pt-5 flex-row items-center justify-between">
        <Pressable className="w-[15%] py-1" onPress={() => router.back()}>
          <Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
        </Pressable>
        <Text className="text-muted-foreground text-sm text-center font-lausanne-regular leading-normal">
          Email Verification
        </Text>
        <View className="w-[15%]" />
      </View>




      {/* Content */}
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={100}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="py-6 px-5 flex-grow">

        <View className="mb-8">
          <Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">Confirm it's you</Text>
          <Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">Please enter the code below to verify your email. We’ve just sent it to</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground text-base font-lausanne-light leading-normal">{email}</Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-foreground text-base font-lausanne-regular leading-normal">(Change)</Text>
            </Pressable>
          </View>
        </View>


        <TextInput
          ref={codeInputRef}
          autoCorrect={false}
          onChangeText={setCode}
          allowFontScaling={false}
          onSubmitEditing={() => { }}
          enterKeyHint="done"
          enablesReturnKeyAutomatically={true}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          keyboardType="number-pad"
          placeholder="Enter your code"
          placeholderTextColor={Colors.placeholder}
          className="bg-background border-b border-foreground text-foreground font-lausanne-light mb-8"
          style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
        />
        <Pressable
          onPress={handleSignIn}
          disabled={code.trim().length !== 6}
          className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${code.trim().length !== 6 ? "opacity-50" : ""
            }`}>
          {isLoading ? (
            <ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
          ) : (
            <Text className="text-background font-lausanne-light text-xl">Submit code</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}
