import { Colors } from "@/constants/colors";
import { isFullySold } from "@/components/assets/asset-detail-helpers";
import { Asset } from "@/types/custom";
import { getAssets, getAssetsSync } from "@/utils/storage";
import { useCurrentPriceBulk } from "@/utils/api/finance";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { useSubscription } from "@/utils/subscription-context";
import { PortfolioHealth } from "@/components/analysis/portfolio-health";
import { GeographicExposure } from "@/components/analysis/geographic-exposure";
import { CurrencyExposure } from "@/components/analysis/currency-exposure";
import { SectorTreemap } from "@/components/analysis/sector-treemap";
import { useSession } from "@/utils/auth-context";
import { EmptyState } from "@/components/analysis/empty-state";

/** Asset types that support live price fetching */
const LIVE_PRICE_TYPES = new Set(["stocks_etfs", "crypto", "precious_metals"]);

/** Get the ticker/symbol used to fetch the current price for an asset */
function getAssetSymbol(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return asset.ticker;
		case "crypto":
			return asset.symbol;
		case "precious_metals":
			switch (asset.metalType) {
				case "gold": return "GC=F";
				case "silver": return "SI=F";
				case "platinum": return "PL=F";
				case "palladium": return "PA=F";
				default: return "";
			}
		default:
			return "";
	}
}

type PriceData = { price: number; currency: string };

/** Load filtered assets synchronously for instant first render */
function loadInitialAssets(): Asset[] {
	return getAssetsSync().filter((a) => !isFullySold(a));
}

export default function AnalysisScreen() {
	const { user } = useSession();
	const { isPremium } = useSubscription();
	const [assets, setAssets] = useState<Asset[]>(loadInitialAssets);

	// Refresh assets from storage when the tab is focused (e.g. after add/edit)
	useFocusEffect(
		useCallback(() => {
			let cancelled = false;
			getAssets().then((storedAssets) => {
				if (cancelled) return;
				const filtered = storedAssets.filter((a) => !isFullySold(a));
				setAssets((prev) => {
					if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev;
					return filtered;
				});
			}).catch((error) => {
				console.error("Error refreshing assets:", error);
			});
			return () => { cancelled = true; };
		}, [])
	);

	// Collect unique symbols for live-price assets
	const liveSymbols = useMemo(() => {
		const symbols = new Set<string>();
		assets.forEach((asset) => {
			if (LIVE_PRICE_TYPES.has(asset.type)) {
				const symbol = getAssetSymbol(asset);
				if (symbol) symbols.add(symbol);
			}
		});
		return Array.from(symbols);
	}, [assets]);

	// Fetch current prices via bulk endpoint (single request for all symbols)
	const symbolsParam = useMemo(() => liveSymbols.join(","), [liveSymbols]);
	const { data: bulkPrices } = useCurrentPriceBulk(symbolsParam, liveSymbols.length > 0);

	const currentPrices = useMemo(() => {
		const prices: Record<string, PriceData> = {};
		if (bulkPrices) {
			liveSymbols.forEach((symbol) => {
				const data = bulkPrices[symbol];
				if (data) {
					prices[symbol] = { price: data.current_price, currency: data.currency };
				}
			});
		}
		return prices;
	}, [bulkPrices, liveSymbols]);

	if (assets.length === 0) {
		return (
			<EmptyState isPremium={isPremium} />
		);
	}

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="pt-safe">
				<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
					<View>
						<Text className="text-foreground text-2xl font-lausanne-medium">Analysis</Text>
						<Text className="text-muted-foreground text-sm font-lausanne-light">
							Portfolio risk and diversification
						</Text>
					</View>
					{!isPremium && (
						<View className="bg-accent px-3 py-1.5 flex-row items-center gap-2">
							<Icon name="vip-crown-line" size="18" color={Colors.foreground} fallback={null} />
							<Text className="text-foreground text-xs font-lausanne-medium">Free Plan</Text>
						</View>
					)}
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName="px-5 pb-10"
			>
				<PortfolioHealth assets={assets} currentPrices={currentPrices} />

				<GeographicExposure assets={assets} isPremium={isPremium} userCurrency={user?.currency ?? 'USD'} currentPrices={currentPrices} />

				<CurrencyExposure assets={assets} isPremium={isPremium} currentPrices={currentPrices} />

				<SectorTreemap assets={assets} isPremium={isPremium} currentPrices={currentPrices} userCurrency={user?.currency ?? 'USD'} />

			</ScrollView>
		</View>
	);
}