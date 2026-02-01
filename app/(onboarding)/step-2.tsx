import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Icon from "react-native-remix-icon";

const STEP_NUMBER = 2;
const TOTAL_STEPS = 8;

const URL_PATTERN = /^https?:\/\/|www\.|\.(?:com|net|org|edu|gov|io|co|es|mx|app|dev)\b/i;
const VALID_NAME_PATTERN = /^[\p{L}\s\-']+$/u;
const MIN_LENGTH_DEBOUNCE_MS = 500;

export default function Step2() {
  const { email, googleId, appleId } = useLocalSearchParams<{ email?: string; googleId?: string; appleId?: string }>();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.98, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  };

  const validateImmediate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (URL_PATTERN.test(trimmed)) return "Please enter a valid name, not a URL";
    if (/\d/.test(trimmed)) return "Name cannot contain numbers";
    if (!VALID_NAME_PATTERN.test(trimmed)) return "Name can only contain letters, spaces, hyphens and apostrophes";
    if (trimmed.length > 50) return "Name must be less than 50 characters";

    return null;
  };

  const handleNameChange = (text: string) => {
    setName(text);

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Check immediate errors first
    const immediateError = validateImmediate(text);
    if (immediateError) {
      setError(immediateError);
      return;
    }

    // If valid so far, clear error immediately
    const trimmed = text.trim();
    if (trimmed.length >= 2 || !trimmed) {
      setError("");
      return;
    }

    // Debounce the "too short" error
    debounceRef.current = setTimeout(() => {
      if (trimmed.length > 0 && trimmed.length < 2) {
        setError("Name must be at least 2 characters");
      }
    }, MIN_LENGTH_DEBOUNCE_MS);
  };

  const isValid = name.trim().length >= 2 && !validateImmediate(name);
  const isNextButtonDisabled = !isValid;

  return (
    <View className="flex-1 my-safe">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-5 flex-row items-center justify-between">
        <Pressable className="w-[15%] py-1" onPress={() => router.back()}>
          <Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
        </Pressable>
        <Text className="text-muted-foreground text-sm text-center font-lausanne-regular leading-normal">
          Step {STEP_NUMBER} of {TOTAL_STEPS}
        </Text>
        <View className="w-[15%]" />
      </View>

      {/* Content */}
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow px-5 mt-6">
        <View className="mb-8">
          <Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">Let's personalize your experience</Text>
          <Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">What should we call you?</Text>
        </View>

        <View>
          <TextInput
            autoCorrect={false}
            onChangeText={handleNameChange}
            allowFontScaling={false}
            enterKeyHint="done"
            enablesReturnKeyAutomatically={true}
            textContentType="name"
            autoComplete="name-given"
            placeholder="Your first name"
            placeholderTextColor={Colors.placeholder}
            className={`bg-background border-b ${error ? "border-red-600" : "border-foreground"} text-foreground font-lausanne-light`}
            style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
          />
          {error !== "" && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
              <Text className="text-red-600 text-sm font-lausanne-regular mt-2">
                {error}
              </Text>
            </Animated.View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Footer with Next Button */}
      <View className="px-5 pb-5 pt-4">
        <Animated.View style={[buttonAnimatedStyle]}>
          <Pressable
            disabled={isNextButtonDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              router.push({ pathname: "/(onboarding)/step-3", params: { name: name.trim(), email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null } });
            }}
            className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${isNextButtonDisabled ? "opacity-50" : ""
              }`}>
            <Text className="text-white font-lausanne-light text-xl">Continue</Text>
            <AnimatedArrow color={Colors.accent} size={21} animate={!isNextButtonDisabled} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
