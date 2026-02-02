import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import { registerForPushNotificationsAsync, requestNotificationPermissions } from "@/utils/notifications";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowBendRightUpIcon } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

const BASE_STEP_NUMBER = 7;
const BASE_TOTAL_STEPS = 8;

export default function Step7() {
	const { name, email, googleId, appleId, profile, goals, skippedNameStep } = useLocalSearchParams<{
		name: string;
		email?: string;
		googleId?: string;
		appleId?: string;
		profile: string;
		goals: string;
		skippedNameStep?: string;
	}>();

	// Adjust step number and total based on whether name step was skipped
	const didSkipNameStep = skippedNameStep === "true";
	const stepNumber = didSkipNameStep ? BASE_STEP_NUMBER - 1 : BASE_STEP_NUMBER;
	const totalSteps = didSkipNameStep ? BASE_TOTAL_STEPS - 1 : BASE_TOTAL_STEPS;

	const buttonScaleSkip = useSharedValue(1);
	const buttonScaleEnable = useSharedValue(1);

	const buttonSkipAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScaleSkip.value }],
	}));

	const buttonEnableAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScaleEnable.value }],
	}));

	const handlePressInSkip = () => {
		buttonScaleSkip.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handlePressOutSkip = () => {
		buttonScaleSkip.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	const handlePressInEnable = () => {
		buttonScaleEnable.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handlePressOutEnable = () => {
		buttonScaleEnable.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	async function enableNotifications() {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		await requestNotificationPermissions();
		const token = await registerForPushNotificationsAsync();
		if (token) {
			router.push({ pathname: "/(onboarding)/step-8", params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile, goals, notificationToken: token ?? null, skippedNameStep: skippedNameStep ?? null } });
		} else {
			router.push({ pathname: "/(onboarding)/step-8", params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile, goals, skippedNameStep: skippedNameStep ?? null } });
		}
	}

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
			<View className="flex-1 px-5 pt-6 pb-10">
				{/* Hero Section */}
				<View>
					<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
						Stay ahead of what matters
					</Text>
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal mb-6">
						Get alerts for bond maturities, earnings reports, and global events. We'll notify you when market shifts impact your investments so you can act with confidence.
					</Text>
				</View>
				<View className="flex-1 items-center justify-center px-2">

					<View
						// onPress={enableNotifications}
						className="bg-[#EFEFED] border border-white items-center justify-center w-[91%] max-w-[340px]"
						style={{ transform: [{ scale: 0.95 }], borderRadius: 36 }}>
						<View className="p-5">
							<Text className="text-foreground font-lausanne-regular mb-2 px-2" style={{ fontSize: 19 }}>
								Onefolio wants to send you notifications
							</Text>
							<Text className="text-muted-foreground text-base font-lausanne-light leading-normal mb-5 px-2">
								Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.
							</Text>
							<View className="flex-row items-center justify-between gap-2">
								<View className="flex-1 py-3 bg-[#d9d9d8] rounded-full">
									<Text className="text-foreground text-lg text-center font-lausanne-regular">Don't Allow</Text>
								</View>
								<View className="flex-1 py-3 bg-[#d9d9d8] rounded-full">
									<Text className="text-600 text-lg text-center font-lausanne-regular">Allow</Text>
								</View>
							</View>
						</View>
					</View>
					<View className="flex-row w-[90%] max-w-[290px] items-center justify-end mt-3 pr-[16%]">
						<ArrowBendRightUpIcon color={Colors.foreground} size={34} />
					</View>
				</View>

			</View>

			{/* Footer with Next Button */}
			<View className="px-5 pb-5 pt-4 flex-row items-center justify-between gap-2">
				<Animated.View style={[{ flex: 1, maxWidth: 144 }, buttonSkipAnimatedStyle]}>
					<Pressable
						onPressIn={handlePressInSkip}
						onPressOut={handlePressOutSkip}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
							router.push({ pathname: "/(onboarding)/step-8", params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile, goals, skippedNameStep: skippedNameStep ?? null } });
						}}
						className="bg-secondary flex-row items-center justify-center gap-3 py-4 border border-secondary">
						<Text className="text-foreground font-lausanne-light text-xl">
							Skip
						</Text>
					</Pressable>
				</Animated.View>
				<Animated.View style={[{ flex: 1 }, buttonEnableAnimatedStyle]}>
					<Pressable
						onPressIn={handlePressInEnable}
						onPressOut={handlePressOutEnable}
						onPress={enableNotifications}
						className="bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground">
						<Text className="text-white font-lausanne-light text-xl">Get alerts</Text>
						<AnimatedArrow color={Colors.accent} size={21} animate={true} />
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}
