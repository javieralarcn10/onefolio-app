import { Colors } from "@/constants/colors";
import { hasCompletedOnboarding } from "@/utils/storage";
import * as Haptics from "expo-haptics";
import { Image, ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TrendUpIcon } from "phosphor-react-native";
import React, { useLayoutEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function Welcome() {
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  const checkOnboardingCompleted = async () => {
    const completedOnboarding = await hasCompletedOnboarding();
    setCompletedOnboarding(completedOnboarding);
  };

  useLayoutEffect(() => {
    checkOnboardingCompleted();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: 'welcome' }} style={{ flex: 1 }}
        contentFit="cover">
        <View className="flex-1 bg-black/60">
          <View className="flex-row items-center justify-center flex-1">
            <View className="flex-row items-center gap-3">
              <Image source={{ uri: 'logo' }} tintColor={Colors.background} style={{ width: 35, height: 35 }} contentFit="contain" />
              <Text className="text-background text-4xl font-lausanne-semibold leading-normal">Onefolio</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View className="bg-background pb-safe px-5 pt-9">
        <Text className="text-foreground text-2xl font-lausanne-medium leading-snug mb-2">See your real exposure to the world</Text>
        <Text className="text-muted-foreground text-lg font-lausanne-light leading-normal mb-8">
          Understand how geopolitics and macro events affect your wealth across countries, currencies and sectors.
        </Text>
        <Pressable
          className="bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            router.push("/(onboarding)/step-1");
          }}>
          <Text className="text-background font-lausanne-light text-xl">Start now</Text>
          <TrendUpIcon color={Colors.accent} size={21} />
        </Pressable>
        <Text className="text-foreground text-sm text-center mt-2 font-lausanne-light leading-normal">
          By continuing, you accept our <Text className="font-lausanne-medium">Terms of Use</Text>.
        </Text>
      </View>
    </>
  );
}
