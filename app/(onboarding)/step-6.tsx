import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import { setBiometricEnabled } from "@/utils/storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeftIcon } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	Easing,
} from "react-native-reanimated";

const STEP_NUMBER = 6;
const TOTAL_STEPS = 7;

type BiometricType = "faceid" | "fingerprint" | "none";

export default function Step6() {
	const { name, profile, goals } = useLocalSearchParams<{
		name: string;
		profile: string;
		goals: string;
	}>();

	const [biometricType, setBiometricType] = useState<BiometricType>("none");

	// Pulse animation
	const scale = useSharedValue(1);

	useEffect(() => {
		scale.value = withRepeat(
			withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
			-1, // infinite repeat
			true // reverse
		);
	}, []);

	const pulseStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	useEffect(() => {
		checkBiometricSupport();
	}, []);

	const checkBiometricSupport = async () => {
		const compatible = await LocalAuthentication.hasHardwareAsync();

		if (compatible) {
			const types =
				await LocalAuthentication.supportedAuthenticationTypesAsync();
			if (
				types.includes(
					LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
				)
			) {
				setBiometricType("faceid");
			} else if (
				types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
			) {
				setBiometricType("fingerprint");
			}
		}
	};

	const getBiometricLabel = () => {
		if (biometricType === "faceid") {
			return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
		}
		return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
	};

	const handleEnable = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

		const result = await LocalAuthentication.authenticateAsync({
			promptMessage: `Enable ${getBiometricLabel()}`,
			fallbackLabel: "Use passcode",
			cancelLabel: "Cancel",
		});

		if (result.success) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			await setBiometricEnabled(true);
			router.push({
				pathname: "/(onboarding)/step-7",
				params: { name, profile, goals },
			});
		} else {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	};

	const handleSkip = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		router.push({
			pathname: "/(onboarding)/step-7",
			params: { name, profile, goals },
		});
	};

	return (
		<View className="flex-1 my-safe">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="px-5 pt-5 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<ArrowLeftIcon color={Colors.foreground} size={24} />
				</Pressable>
				<Text className="text-muted-foreground text-sm text-center font-lausanne-regular leading-normal">
					Step {STEP_NUMBER} of {TOTAL_STEPS}
				</Text>
				<View className="w-[15%]" />
			</View>

			{/* Content */}
			<View className="flex-1 px-5 pt-6">
				{/* Title & Description */}
				<View className="mb-8">
					<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
						Keep your data protected
					</Text>
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						Enable {getBiometricLabel()} for quick and secure access to your portfolio. You can change this anytime in settings.
					</Text>
				</View>

				{/* Biometric Icon */}
				<View className="flex-grow mb-16 items-center justify-center">
					<Animated.View style={pulseStyle}>
						{biometricType === "faceid" ? (
							<Image
								source={{ uri: "face-id" }}
								style={{ width: 75, height: 75 }}
								tintColor={Colors.foreground}
								contentFit="contain"
							/>
						) : (
							<Image
								source={{ uri: "touch-id" }}
								style={{ width: 75, height: 75 }}
								tintColor={Colors.foreground}
								contentFit="contain"
							/>
						)}
					</Animated.View>
				</View>
			</View>

			{/* Footer with Buttons */}
			<View className="px-5 pb-5 pt-4 flex-row items-center justify-between gap-2">
				<Pressable
					onPress={handleSkip}
					className="bg-secondary flex-row items-center justify-center gap-3 py-4 border border-secondary flex-grow max-w-36"
				>
					<Text className="text-foreground font-lausanne-light text-xl">
						Not now
					</Text>
				</Pressable>
				<Pressable
					onPress={handleEnable}
					className="bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground flex-grow"
				>
					<Text className="text-white font-lausanne-light text-xl">Enable</Text>
					<AnimatedArrow color={Colors.accent} size={21} animate={true} />
				</Pressable>
			</View>
		</View>
	);
}
