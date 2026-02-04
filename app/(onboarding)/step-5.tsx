import { AnimatedArrow } from "@/components/animated-arrow";
import { AssetOption } from "@/components/onboarding/asset-option";
import { Colors } from "@/constants/colors";
import { AssetOption as AssetOptionType, AssetType } from "@/types/custom";
import { useOnboarding } from "@/utils/onboarding-context";
import { addAsset } from "@/utils/storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

const BASE_STEP_NUMBER = 5;
const BASE_TOTAL_STEPS = 8;

export const ASSETS_OPTIONS: AssetOptionType[] = [
	{
		id: 1,
		title: "Stocks & ETFs",
		description: "Stocks, index funds, ETFs",
		icon: "stock-line",
		assetType: "stocks_etfs" as AssetType,
		bgIcon: "#dbe7f0",
		colorIcon: "#213C51",
	},
	{
		id: 2,
		title: "Bonds & Fixed Income",
		description: "Bonds, treasury bills, fixed income",
		icon: "bank-line",
		assetType: "bonds" as AssetType,
		colorIcon: "#9E3B3B",
		bgIcon: "#f1dada",
	},
	{
		id: 3,
		title: "Deposits",
		description: "Fixed deposits, high-yield accounts",
		icon: "safe-3-line",
		assetType: "deposits" as AssetType,
		colorIcon: "#5C8D89",
		bgIcon: "#e0ebea",
	},
	{
		id: 4,
		title: "Precious Metals",
		description: "Gold, silver (physical or ETFs)",
		icon: "diamond-line",
		assetType: "precious_metals" as AssetType,
		colorIcon: "#FAB12F",
		bgIcon: "#feeccd",
	},
	{
		id: 5,
		title: "Real Estate",
		description: "Properties, REITs, crowdfunding",
		icon: "building-line",
		assetType: "real_estate" as AssetType,
		colorIcon: "#8B7BA8",
		bgIcon: "#f0ebf5",
	},
	{
		id: 6,
		title: "Private Investments",
		description: "Loans, crowdlending, equity stakes",
		icon: "hand-coin-line",
		assetType: "private_investments" as AssetType,
		colorIcon: "#116A7B",
		bgIcon: "#e9f9fc",
	},
	{
		id: 7,
		title: "Cash",
		description: "Cash, checking accounts",
		icon: "cash-line",
		assetType: "cash" as AssetType,
		colorIcon: "#7B6079",
		bgIcon: "#eee9ec",
	},
	{
		id: 8,
		title: "Crypto",
		description: "Bitcoin, Ethereum, others",
		icon: "btc-line",
		assetType: "crypto" as AssetType,
		colorIcon: "#F1935C",
		bgIcon: "#fce7dc",
	},
];

export default function Step5() {
	const { name, email, googleId, appleId, profile, goals, skippedNameStep } = useLocalSearchParams<{
		name: string;
		email?: string;
		googleId?: string;
		appleId?: string;
		profile: string;
		goals: string;
		skippedNameStep?: string;
	}>();
	const { pendingAssets, getAssetsByType, clearPendingAssets } = useOnboarding();

	// Adjust step number and total based on whether name step was skipped
	const didSkipNameStep = skippedNameStep === "true";
	const stepNumber = didSkipNameStep ? BASE_STEP_NUMBER - 1 : BASE_STEP_NUMBER;
	const totalSteps = didSkipNameStep ? BASE_TOTAL_STEPS - 1 : BASE_TOTAL_STEPS;

	const isNextButtonDisabled = pendingAssets.length < 2;
	const buttonText = pendingAssets.length == 0 ? "Continue" : pendingAssets.length < 2 ? "Add at least 2 investments" : "Continue";

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

	const handleContinue = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

		// Save all pending assets to storage
		for (const asset of pendingAssets) {
			await addAsset(asset);
		}

		// Clear pending assets from context
		clearPendingAssets();

		// Navigate to next step
		router.push({
			pathname: "/(onboarding)/step-6",
			params: { name, email: email ?? null, googleId: googleId ?? null, appleId: appleId ?? null, profile, goals, skippedNameStep: skippedNameStep ?? null },
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
					Step {stepNumber} of {totalSteps}
				</Text>
				<View className="w-[15%]" />
			</View>

			{/* Content */}
			<ScrollView contentContainerClassName="flex-grow pt-6 pb-10">
				<View className="mb-8 px-5">
					<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">
						Add your first assets
					</Text>
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						Start with a few to see your global exposure. You can always add
						more later.
					</Text>
				</View>
				<View className="flex gap-2 px-5">
					{ASSETS_OPTIONS.map((option) => (
						<AssetOption
							key={option.id}
							asset={option}
							assets={getAssetsByType(option.assetType)}
						/>
					))}
				</View>
			</ScrollView>

			{/* Footer with Next Button */}
			<View className="px-5 pb-5 pt-4">
				<LinearGradient
					colors={[
						"rgba(255, 255, 255, 0)",
						"rgba(255, 255, 255, 0.7)",
						"#fff",
					]}
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: -40,
						height: 60,
					}}
				/>
				<Animated.View style={[buttonAnimatedStyle]}>
					<Pressable
						disabled={isNextButtonDisabled}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onPress={handleContinue}
						className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${isNextButtonDisabled ? "opacity-50" : ""}`}
					>
						<Text className="text-white font-lausanne-light text-xl">
							{buttonText}
						</Text>
						<AnimatedArrow
							color={Colors.accent}
							size={21}
							animate={!isNextButtonDisabled}
						/>
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}