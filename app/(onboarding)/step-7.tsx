import { AnimatedArrow } from "@/components/animated-arrow";
import { Colors } from "@/constants/colors";
import { registerForPushNotificationsAsync, requestNotificationPermissions } from "@/utils/notifications";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowBendRightUpIcon, ArrowLeftIcon } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

const STEP_NUMBER = 7;
const TOTAL_STEPS = 7;

export default function Step7() {
	const { name, profile, goals } = useLocalSearchParams<{
		name: string;
		profile: string;
		goals: string;
	}>();

	async function enableNotifications() {
		await requestNotificationPermissions();
		const token = await registerForPushNotificationsAsync();
		if (token) {
			router.push({ pathname: "/(onboarding)/step-8", params: { name, profile, goals, notificationsToken: token } });
		} else {
			router.push({ pathname: "/(onboarding)/step-8", params: { name, profile, goals } });
		}
	}

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
			<View className="flex-1 px-5 pt-6 pb-10">
				{/* Hero Section */}
				<View>
					<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
						Stay ahead of what matters
					</Text>
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal mb-6">
						Get alerts when global events or market shifts could impact your investments. We'll notify you about risks so you can act with confidence.
					</Text>
				</View>
				<View className="flex-1 items-center justify-center px-2">
					<Pressable
						onPress={enableNotifications}
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
					</Pressable>
					<View className="flex-row w-[90%] max-w-[290px] items-center justify-end mt-3 pr-[16%]">
						<ArrowBendRightUpIcon color={Colors.foreground} size={34} />
					</View>
				</View>

			</View>

			{/* Footer with Next Button */}
			<View className="px-5 pb-5 pt-4 flex-row items-center justify-between gap-2">
				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
						router.push({ pathname: "/(onboarding)/step-8", params: { name, profile, goals } });
					}}
					className="bg-secondary flex-row items-center justify-center gap-3 py-4 border border-secondary flex-grow max-w-36">
					<Text className="text-foreground font-lausanne-light text-xl">
						Not now
					</Text>
				</Pressable>
				<Pressable
					onPress={enableNotifications}
					className="bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground flex-grow">
					<Text className="text-white font-lausanne-light text-xl">Enable</Text>
					<AnimatedArrow color={Colors.accent} size={21} animate={true} />
				</Pressable>
			</View>
		</View>
	);
}
