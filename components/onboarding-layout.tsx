import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeftIcon } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

// ============================================================================
// Types
// ============================================================================

interface OnboardingLayoutProps {
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  nextRoute?: string;
  nextButtonText?: string;
  isNextDisabled?: boolean;
  showBackButton?: boolean;
  showStepIndicator?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function OnboardingLayout({
  stepNumber,
  totalSteps,
  children,
  nextRoute,
  nextButtonText = "Continue",
  isNextDisabled = false,
  showBackButton = true,
  showStepIndicator = true,
}: OnboardingLayoutProps) {
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    if (nextRoute) {
      router.push(nextRoute as any);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View className="flex-1 my-safe bg-background">
      {/* Header */}
      <View className="px-5 pt-5 flex-row items-center justify-between">
        {showBackButton && stepNumber > 1 ? (
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-foreground/5"
          >
            <ArrowLeftIcon color={Colors.foreground} size={20} />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}

        {showStepIndicator && (
          <Animated.View entering={FadeIn.delay(100)}>
            <View className="flex-row gap-1.5">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index < stepNumber ? "bg-accent w-6" : "bg-foreground/10 w-1.5"
                  }`}
                />
              ))}
            </View>
          </Animated.View>
        )}

        <View className="w-10" />
      </View>

      {/* Content */}
      <View className="flex-1">{children}</View>

      {/* Footer with Next Button */}
      {nextRoute && (
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          className="px-5 pb-5 pt-4"
        >
          <Pressable
            disabled={isNextDisabled}
            onPress={handleNext}
            className={`bg-accent flex-row items-center justify-center gap-3 py-4 rounded-xl ${
              isNextDisabled ? "opacity-50" : ""
            }`}
          >
            <Text className="text-foreground font-lausanne-semibold text-lg">
              {nextButtonText}
            </Text>
            <AnimatedArrow
              color={Colors.foreground}
              size={20}
              animate={!isNextDisabled}
            />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// ============================================================================
// Animated Text Components
// ============================================================================

export function OnboardingTitle({
  children,
  delay = 200,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).springify()}
      className="text-foreground text-4xl font-lausanne-bold leading-tight"
    >
      {children}
    </Animated.Text>
  );
}

export function OnboardingSubtitle({
  children,
  delay = 300,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).springify()}
      className="text-foreground/60 text-lg font-lausanne leading-relaxed mt-4"
    >
      {children}
    </Animated.Text>
  );
}

export function OnboardingHighlight({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Text className="text-foreground font-lausanne-semibold">{children}</Text>;
}
