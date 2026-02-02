import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

const BASE_STEP_NUMBER = 8;
const BASE_TOTAL_STEPS = 8;

export default function Step8() {
	const { name, email, googleId, appleId, profile, goals, notificationToken, skippedNameStep } = useLocalSearchParams<{
		name: string;
		email?: string;
		googleId?: string;
		appleId?: string;
		profile: string;
		goals: string;
		notificationToken: string;
		skippedNameStep?: string;
	}>();

	// Adjust step number and total based on whether name step was skipped
	const didSkipNameStep = skippedNameStep === "true";
	const stepNumber = didSkipNameStep ? BASE_STEP_NUMBER - 1 : BASE_STEP_NUMBER;
	const totalSteps = didSkipNameStep ? BASE_TOTAL_STEPS - 1 : BASE_TOTAL_STEPS;

	const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

	const buttonScale = useSharedValue(1);
	const checkboxScale = useSharedValue(1);

	const buttonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScale.value }],
	}));

	const checkboxAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: checkboxScale.value }],
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

	const handleCheckboxPressIn = () => {
		checkboxScale.value = withTiming(0.9, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleCheckboxPressOut = () => {
		checkboxScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	const toggleTerms = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setHasAcceptedTerms(!hasAcceptedTerms);
	};

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		router.push({ pathname: "/(onboarding)/step-9", params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile, goals, notificationToken } });
	};

	const openTerms = () => {
		Linking.openURL("https://onefolio.app/terms-of-service");
	};

	const openPrivacy = () => {
		Linking.openURL("https://onefolio.app/privacy-policy");
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
				Step {stepNumber} of {totalSteps}
			</Text>
				<View className="w-[15%]" />
			</View>

			{/* Content */}
			<ScrollView contentContainerClassName="flex-grow pt-6 pb-10 px-5">
				<View className="mb-8">
					<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
						One last thing, {name}
					</Text>
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						Before you see your global exposure, please review and accept our terms. Your data stays private and secure.
					</Text>
				</View>

				{/* Terms Checkbox */}
				<Pressable
					onPressIn={handleCheckboxPressIn}
					onPressOut={handleCheckboxPressOut}
					onPress={toggleTerms}
					className="flex-row items-start gap-3 mt-2"
				>
					<Animated.View style={checkboxAnimatedStyle}>
						<View
							className={`mt-0.5 w-6 h-6 border-2 items-center justify-center ${hasAcceptedTerms ? "bg-foreground border-foreground" : "bg-background border-foreground"
								}`}
						>
							{hasAcceptedTerms && (
								<Icon name="check-line" size="16" color={Colors.background} fallback={null} />
							)}
						</View>
					</Animated.View>
					<Text className="flex-1 text-base font-lausanne-light text-foreground leading-relaxed">
						I agree to the{" "}
						<Text onPress={openTerms} className="underline text-foreground">
							Terms of Service
						</Text>{" "}
						and{" "}
						<Text onPress={openPrivacy} className="underline text-foreground">
							Privacy Policy
						</Text>
						. I understand that Onefolio provides informational insights and does not constitute financial advice.
					</Text>
				</Pressable>
			</ScrollView>

			{/* Footer with Next Button */}
			<View className="px-5 pb-5 pt-4">
				<Animated.View style={buttonAnimatedStyle}>
					<Pressable
						disabled={!hasAcceptedTerms}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onPress={handleContinue}
						className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${!hasAcceptedTerms ? "opacity-50" : ""
							}`}
					>
						<Text className="text-white font-lausanne-light text-xl">Continue</Text>
						<AnimatedArrow color={Colors.accent} size={21} animate={hasAcceptedTerms} />
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}
