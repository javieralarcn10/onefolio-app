import { ASSETS_OPTIONS, getAssetValue } from "@/components/assets/asset-config";
import { AssetTypeSection } from "@/components/assets/asset-type-section";
import { EmptyState } from "@/components/assets/empty-state";
import { isFullySold, getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { Colors } from "@/constants/colors";
import { Asset, AssetType } from "@/types/custom";
import { getAssets } from "@/utils/storage";
import { fetchCurrentPrice } from "@/utils/api/finance";
import { useQueries } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";
import { useSession } from "@/utils/auth-context";

const LIVE_PRICE_TYPES = new Set(["stocks_etfs", "crypto", "precious_metals"]);

function getAssetSymbol(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs": return asset.ticker;
		case "crypto": return asset.symbol;
		case "precious_metals":
			switch (asset.metalType) {
				case "gold": return "GC=F";
				case "silver": return "SI=F";
				case "platinum": return "PL=F";
				case "palladium": return "PA=F";
				default: return "";
			}
		default: return "";
	}
}

type PriceData = { price: number; currency: string };

function getAssetCurrentValue(asset: Asset, currentPrices: Record<string, PriceData>): number {
	if (LIVE_PRICE_TYPES.has(asset.type)) {
		const symbol = getAssetSymbol(asset);
		if (symbol && currentPrices[symbol]) {
			return getNetQuantity(asset) * currentPrices[symbol].price;
		}
	}
	return getAssetValue(asset);
}

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

	// Collect unique symbols for live-price assets
	const liveSymbols = useMemo(() => {
		const symbols = new Set<string>();
		activeAssets.forEach((asset) => {
			if (LIVE_PRICE_TYPES.has(asset.type)) {
				const symbol = getAssetSymbol(asset);
				if (symbol) symbols.add(symbol);
			}
		});
		return Array.from(symbols);
	}, [activeAssets]);

	// Fetch current prices via react-query (shares cache with useCurrentPrice)
	const priceQueries = useQueries({
		queries: liveSymbols.map((symbol) => ({
			queryKey: ["current-price", symbol],
			queryFn: () => fetchCurrentPrice(symbol),
			enabled: symbol.length > 0,
			staleTime: 15 * 60 * 1000,
			gcTime: 15 * 60 * 1000,
			retry: 1,
		})),
	});

	const currentPrices = useMemo(() => {
		const prices: Record<string, PriceData> = {};
		liveSymbols.forEach((symbol, i) => {
			const data = priceQueries[i]?.data;
			if (data) {
				prices[symbol] = { price: data.current_price, currency: data.currency };
			}
		});
		return prices;
	}, [liveSymbols, priceQueries]);

	// Group active assets by type
	const groupedAssets = activeAssets.reduce((acc, asset) => {
		if (!acc[asset.type]) {
			acc[asset.type] = [];
		}
		acc[asset.type].push(asset);
		return acc;
	}, {} as Record<AssetType, Asset[]>);

	const totalValue = activeAssets.reduce((sum, asset) => sum + getAssetCurrentValue(asset, currentPrices), 0);

	useEffect(() => {
		transformNumberToUserCurrency(totalValue).then(setFormattedTotal);
	}, [totalValue, user?.currency]);

	// Calculate total value per asset type and sort by value (highest to lowest)
	const assetTypes = (Object.keys(groupedAssets) as AssetType[]).sort((a, b) => {
		const valueA = groupedAssets[a].reduce((sum, asset) => sum + getAssetCurrentValue(asset, currentPrices), 0);
		const valueB = groupedAssets[b].reduce((sum, asset) => sum + getAssetCurrentValue(asset, currentPrices), 0);
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
					{assetTypes.map((type) => {
						const typeAssets = groupedAssets[type];
						const costBasis = typeAssets.reduce((sum, a) => sum + getAssetValue(a), 0);
						const currentValue = typeAssets.reduce((sum, a) => sum + getAssetCurrentValue(a, currentPrices), 0);

						// Use API currency for live-price types
						let valueCurrency: string | undefined;
						if (LIVE_PRICE_TYPES.has(type)) {
							const firstSymbol = getAssetSymbol(typeAssets[0]);
							if (firstSymbol && currentPrices[firstSymbol]) {
								valueCurrency = currentPrices[firstSymbol].currency;
							}
						}

						return (
							<AssetTypeSection
								key={type}
								type={type}
								assets={typeAssets}
								userCurrency={user?.currency}
								currentValue={currentValue}
								costBasis={costBasis}
								valueCurrency={valueCurrency}
								onAssetPress={handleAssetPress}
								onAddPress={() => handleAddToType(type)}
							/>
						);
					})}
				</ScrollView>
			)}
		</View>
	);
}
