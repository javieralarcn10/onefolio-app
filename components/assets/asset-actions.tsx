import { Asset } from "@/types/custom";
import { isFullySold, isIndivisibleAsset } from "./asset-detail-helpers";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type Props = {
	asset: Asset;
	onBuyTransaction?: () => void;
	onSellTransaction?: () => void;
};

export function AssetActions({ asset, onBuyTransaction, onSellTransaction }: Props) {
	const buyButtonScale = useSharedValue(1);
	const sellButtonScale = useSharedValue(1);

	const buyButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buyButtonScale.value }],
	}));

	const sellButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: sellButtonScale.value }],
	}));

	const fullySold = isFullySold(asset);

	// Fully sold: don't show any buttons
	if (fullySold) return null;

	const indivisible = isIndivisibleAsset(asset);

	return (
		<View className="flex-row items-center justify-center gap-2">
		{/* Buy Button — hidden for indivisible assets (physical metals, real estate) */}
		{!indivisible && (
				<Animated.View className="flex-1" style={[buyButtonAnimatedStyle]}>
					<Pressable
						onPressIn={() => {
							buyButtonScale.value = withTiming(0.98, { duration: 100, easing: Easing.out(Easing.ease) });
						}}
						onPressOut={() => {
							buyButtonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
						}}
						onPress={onBuyTransaction}
						className="bg-secondary border border-secondary flex-row items-center justify-center py-4"
					>
						<Text className="text-foreground font-lausanne-regular text-lg">Buy</Text>
					</Pressable>
				</Animated.View>
			)}

			{/* Sell Button */}
			<Animated.View className="flex-1" style={[sellButtonAnimatedStyle]}>
				<Pressable
					onPressIn={() => {
						sellButtonScale.value = withTiming(0.98, { duration: 100, easing: Easing.out(Easing.ease) });
					}}
					onPressOut={() => {
						sellButtonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
					}}
					onPress={onSellTransaction}
					className="bg-foreground border border-foreground flex-row items-center justify-center py-4"
				>
					<Text className="text-background font-lausanne-regular text-lg">Sell</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}
