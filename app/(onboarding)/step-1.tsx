import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

const BASE_STEP_NUMBER = 1;
const BASE_TOTAL_STEPS = 8;


const VALUE_PROPS = [
  {
    title: "Your personal geopolitical map",
    description: "Understand your exposure across regions, currencies and sectors. US, Europe or Asia.",
  },
  {
    title: "Track what others ignore",
    description: "Stocks, bonds, deposits, gold, real estate, etc. Your complete wealth view.",
  },
  {
    title: "Geopolitical Context Alerts",
    description: "Stay ahead with alerts on global tensions affecting your specific portfolio.",
  },
  {
    title: "Your Data, Your Control",
    description: "Read-only access. Your data stays on your device. Zero counterparty risk.",
  },
];


function ValueProp({ prop }: { prop: typeof VALUE_PROPS[0] }) {
  return (
    <View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 bg-accent self-start pl-1 pr-2">
          <Icon name="check-line" size="22" color={Colors.foreground} fallback={null} />
          <Text className="font-lausanne-regular text-foreground text-lg">
            {prop.title}
          </Text>
        </View>
        <View className="pl-9 mt-1">
          <Text className="font-lausanne-light text-muted-foreground text-base">
            {prop.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Step1() {
  const { name, email, googleId, appleId } = useLocalSearchParams<{ name?: string; email?: string; googleId?: string; appleId?: string }>();
  
  // If name is provided, we'll skip step-2, so total steps is 7
  const skippedNameStep = !!(name && email);
  const totalSteps = skippedNameStep ? BASE_TOTAL_STEPS - 1 : BASE_TOTAL_STEPS;
  
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

  return (
    <View className="flex-1 my-safe">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-5 flex-row items-center justify-between">
        <Pressable className="w-[15%] py-1" onPress={() => router.back()}>
          <Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
        </Pressable>
        <Text className="text-muted-foreground text-sm text-center font-lausanne-regular leading-normal">
          Step {BASE_STEP_NUMBER} of {totalSteps}
        </Text>
        <View className="w-[15%]" />
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow px-5 pt-6 pb-10"
      >
        {/* Hero Section */}
        <View>
          <Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
            Control your global exposure
          </Text>
          <Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
            Stocks, bonds, gold, real estate, etc. Wherever they live, see how they connect to the world economy.
          </Text>
        </View>

        {/* Value Props */}
        <View className="mt-8 gap-6">
          {VALUE_PROPS.map((prop) => (
            <ValueProp key={prop.title} prop={prop} />
          ))}
        </View>
      </ScrollView>

      {/* Footer with Next Button */}
      <View className="px-5 pb-5 pt-4">
        <LinearGradient
          colors={["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.7)", "#fff"]}
          style={{ position: "absolute", left: 0, right: 0, top: -40, height: 60 }}
        />
        <Animated.View style={[buttonAnimatedStyle]}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              if (name && email) {
                router.push({ pathname: "/(onboarding)/step-3", params: { name, email, googleId: googleId ?? null, appleId: appleId ?? null, skippedNameStep: "true" } });
              } else if (email) {
                router.push({ pathname: "/(onboarding)/step-2", params: { email, googleId: googleId ?? null, appleId: appleId ?? null } });
              } else {
                router.push({ pathname: "/(onboarding)/step-2" });
              }
            }}
            className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground`}>
            <Text className="text-white font-lausanne-light text-xl">Continue</Text>
            <AnimatedArrow color={Colors.accent} size={21} animate={true} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
