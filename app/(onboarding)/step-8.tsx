import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeftIcon } from "phosphor-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import * as Device from 'expo-device';
import { hasCompletedOnboarding, setOnboardingCompleted, setUser } from "@/utils/storage";
import { getLocales, getCalendars } from "expo-localization";
import { getCustomerInfo, setRevenueCatUserId } from "@/utils/revenue-cat";
import { useSession } from "@/utils/auth-context";
import { usersApi } from "@/utils/api/users";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

const STEP_NUMBER = 7;
const TOTAL_STEPS = 7;

export default function Step8() {
	const { languageCode } = getLocales()[0];
	const { timeZone } = getCalendars()[0];
	const { name, profile, goals, notificationsToken } = useLocalSearchParams<{
		name: string;
		profile: string;
		goals: string[];
		notificationsToken: string;
	}>();
	const { signIn } = useSession();
	const [isLoading, setIsLoading] = useState(false);

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

	const markOnboardingCompleted = async () => {
		const completedOnboarding = await hasCompletedOnboarding();
		if (!completedOnboarding) {
			await setOnboardingCompleted();
		}
	};

	const handleSignIn = async () => {
		setIsLoading(true);

		try {
			const user: any = {
				name,
				investorProfile: profile,
				investmentGoals: goals,
				notificationsToken: notificationsToken ?? null,
				device: {
					manufacturer: Device.manufacturer,
					modelName: Device.modelName,
				}
			};

			// const customerInfo = await getCustomerInfo();
			// if (customerInfo && customerInfo.originalAppUserId) {
			// 	user.revenueCatId = customerInfo.originalAppUserId;
			// }
			if (timeZone !== undefined) {
				user.timezone = timeZone;
			}
			if (languageCode !== undefined) {
				user.language = languageCode;
			}

			// const apiResponse = await usersApi.signInWithoutEmail(user);
			// if (apiResponse.user) {
			if (true) {
				await markOnboardingCompleted();
				await setUser(user);
				// await setUser(apiResponse.user);
				// await setRevenueCatUserId({ userId: apiResponse.user.id, firstName: apiResponse.user.firstName });

				await signIn();
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				router.replace({ pathname: "/(tabs)" });
			} else {
				// throw new Error("Error signing in");
			}
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			console.error("Error handleSignIn: ", error);
			Alert.alert("Error", "An error occurred while trying to sign in. Please try again in a few minutes.", [{ text: "OK" }]);
		} finally {
			setIsLoading(false);
		}

	}

	return (
		<View className="flex-1 my-safe">
			<StatusBar style="dark" />

			{/* Content */}
			<View className="flex-1 items-center justify-center px-5 pt-6 pb-10">
				{/* Hero Section */}
				<View className="mb-8">
					<Text className="text-2xl text-center font-lausanne-medium text-foreground leading-snug mb-2">
						Your portfolio is ready
					</Text>
					<Text className="text-lg text-center font-lausanne-light text-muted-foreground leading-normal">
						We've mapped your investments across currencies, countries, and sectors. See where you're exposed and where you could be stronger.
					</Text>
				</View>

				<Animated.View className="w-full" style={[buttonAnimatedStyle]}>
					<Pressable
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onPress={handleSignIn}
						disabled={isLoading}
						className="bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground w-full">
						{isLoading ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
						) : (
							<>
								<Text className="text-white font-lausanne-light text-xl">Analyze my position</Text>
								<AnimatedArrow color={Colors.accent} size={21} />
							</>
						)}
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}
