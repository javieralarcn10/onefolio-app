import { ASSETS_OPTIONS, getAssetValue } from "@/components/assets/asset-config";
import { AssetTypeSection } from "@/components/assets/asset-type-section";
import { EmptyState } from "@/components/assets/empty-state";
import { isFullySold } from "@/components/assets/asset-detail-helpers";
import { Colors } from "@/constants/colors";
import { Asset, AssetType } from "@/types/custom";
import { getAssets } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";
import { useSession } from "@/utils/auth-context";

export default function AssetsScreen() {
	const { user } = useSession();
	const [assets, setAssets] = useState<Asset[]>([]);
	const [formattedTotal, setFormattedTotal] = useState("");

	useFocusEffect(
		useCallback(() => {
			loadAssets();
		}, [])
	);

	const loadAssets = async () => {
		try {
			const storedAssets = await getAssets();
			setAssets(storedAssets);
		} catch (error) {
			console.error("Error loading assets:", error);
		}
	};

	const handleAddPress = useCallback(() => {
		router.push("/select-asset-type");
	}, []);

	const handleAssetPress = useCallback((asset: Asset) => {
		router.push({
			pathname: "/asset-detail",
			params: { id: asset.id },
		});
	}, []);

	const handleAddToType = useCallback((type: AssetType) => {
		const option = ASSETS_OPTIONS.find((opt) => opt.assetType === type);
		if (option) {
			router.push({
				pathname: "/add-asset",
				params: { type: option.id.toString() },
			});
		}
	}, []);

	// Filter out fully sold assets
	const activeAssets = useMemo(
		() => assets.filter((asset) => !isFullySold(asset)),
		[assets],
	);

	// Group active assets by type
	const groupedAssets = activeAssets.reduce((acc, asset) => {
		if (!acc[asset.type]) {
			acc[asset.type] = [];
		}
		acc[asset.type].push(asset);
		return acc;
	}, {} as Record<AssetType, Asset[]>);

	const totalValue = activeAssets.reduce((sum, asset) => sum + getAssetValue(asset), 0);

	useEffect(() => {
		transformNumberToUserCurrency(totalValue).then(setFormattedTotal);
	}, [totalValue, user?.currency]);

	// Calculate total value per asset type and sort by value (highest to lowest)
	const assetTypes = (Object.keys(groupedAssets) as AssetType[]).sort((a, b) => {
		const valueA = groupedAssets[a].reduce((sum, asset) => sum + getAssetValue(asset), 0);
		const valueB = groupedAssets[b].reduce((sum, asset) => sum + getAssetValue(asset), 0);
		return valueB - valueA;
	});

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="pt-safe">
				<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
					<View>
						<Text className="text-foreground text-2xl font-lausanne-medium">Assets</Text>
						<Text className="text-muted-foreground text-sm font-lausanne-light">
							{activeAssets.length} {activeAssets.length === 1 ? "investment" : "investments"} · {formattedTotal}
						</Text>
					</View>
					<Pressable
						onPress={handleAddPress}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						className="w-10 aspect-square items-center justify-center bg-foreground">
						<Icon name="add-line" size="24" color={Colors.background} fallback={null} />
					</Pressable>
				</View>
			</View>

			{activeAssets.length === 0 ? (
				<EmptyState onAddPress={handleAddPress} />
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerClassName="px-5 pt-2 pb-10 flex-grow"
				>
					{assetTypes.map((type) => (
						<AssetTypeSection
							key={type}
							type={type}
							assets={groupedAssets[type]}
							userCurrency={user?.currency}
							onAssetPress={handleAssetPress}
							onAddPress={() => handleAddToType(type)}
						/>
					))}
				</ScrollView>
			)}
		</View>
	);
}
