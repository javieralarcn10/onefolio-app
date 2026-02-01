import { AnimatedArrow } from "@/components/animated-arrow";
import { Option } from "@/components/onboarding/option";
import { Colors } from "@/constants/colors";
import { OnboardingOption } from "@/types/custom";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

const STEP_NUMBER = 3;
const TOTAL_STEPS = 8;

const INVESTMENT_OPTIONS = [
  {
    id: 1,
    title: "Preserve my capital",
  },
  {
    id: 2,
    title: "Balance risk across regions",
  },
  {
    id: 3,
    title: "Grow wealth long term",
  },
] as const;

export default function Step3() {
  const { name, email, googleId, appleId } = useLocalSearchParams<{ name: string; email?: string; googleId?: string; appleId?: string }>();

  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  const handleSelectOption = useCallback(
    (option: OnboardingOption) => {
      if (selectedId === option.id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setSelectedId(null);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSelectedId(option.id);
      }
    },
    [selectedId],
  );

  const isNextButtonDisabled = selectedId === null;

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

      <ScrollView contentContainerClassName="flex-grow pt-6 pb-10">
        <View className="mb-8 px-5">
          <Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">{name}, what matters most to you?</Text>
          <Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">This helps us show you the right insights. You can change it later.</Text>
        </View>
        {INVESTMENT_OPTIONS.map((option) => (
          <Option key={option.id} option={option} selected={selectedId === option.id} onPress={handleSelectOption} />
        ))}
      </ScrollView>

      {/* Footer with Next Button */}
      <View className="px-5 pb-5 pt-4">
        <Animated.View style={[buttonAnimatedStyle]}>
          <Pressable
            disabled={isNextButtonDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              router.push({ pathname: "/(onboarding)/step-4", params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile: selectedId !== null ? INVESTMENT_OPTIONS.find(option => option.id === selectedId)?.title : null } });
            }}
            className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${isNextButtonDisabled ? "opacity-50" : ""
              }`}>
            <Text className="text-white font-lausanne-light text-xl">Continue</Text>
            <AnimatedArrow color={Colors.accent} size={21} animate={!isNextButtonDisabled} />
          </Pressable>
        </Animated.View>
      </View>
    </View>);
}
