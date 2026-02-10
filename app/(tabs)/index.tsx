import { isFullySold, getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { getAssetValue } from "@/components/assets/asset-config";
import { Asset } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { formatDateShort } from "@/utils/dates";
import { getAssets } from "@/utils/storage";
import { fetchCurrentPrice } from "@/utils/api/finance";
import { useQueries } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { PeriodSelector, PeriodOption } from "@/components/assets/period-selector";
import { PortfolioChart } from "@/components/index/portfolio-chart";
import { AssetDistribution } from "@/components/index/asset-distribution";
import { NewsEvents } from "@/components/index/news-events";
import { useHaptics } from "@/hooks/haptics";
import { useSession } from "@/utils/auth-context";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";
import { MarqueeSymbols } from "@/components/index/marquee-symbols";

// Period options for the chart
const PERIOD_OPTIONS: PeriodOption[] = [
	{ id: "1W", label: "1W" },
	{ id: "1M", label: "1M" },
	{ id: "3M", label: "3M" },
	{ id: "YTD", label: "YTD" },
	{ id: "1Y", label: "1Y" },
	{ id: "ALL", label: "ALL" },
];

type DisplayMode = "value" | "performance";

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

/** Get the current value of an asset using live prices when available */
function getAssetCurrentValue(asset: Asset, currentPrices: Record<string, PriceData>): number {
	if (LIVE_PRICE_TYPES.has(asset.type)) {
		const symbol = getAssetSymbol(asset);
		if (symbol && currentPrices[symbol]) {
			return getNetQuantity(asset) * currentPrices[symbol].price;
		}
	}
	return getAssetValue(asset);
}

function calculatePortfolioValue(assets: Asset[]): number {
	return assets.reduce((total, asset) => total + getAssetValue(asset), 0);
}

function getAssetTypeDistribution(
	assets: Asset[],
	currentPrices: Record<string, PriceData>,
): { type: string; value: number; costBasis: number; currency: string; percentage: number }[] {
	const totalValue = assets.reduce((sum, a) => sum + getAssetCurrentValue(a, currentPrices), 0);
	const distribution: Record<string, { value: number; costBasis: number; currency: string }> = {};

	assets.forEach((asset) => {
		const currentValue = getAssetCurrentValue(asset, currentPrices);
		const costBasis = getAssetValue(asset);

		// Use API currency for live-price types, otherwise asset's stored currency
		let currency = asset.currency || "USD";
		if (LIVE_PRICE_TYPES.has(asset.type)) {
			const symbol = getAssetSymbol(asset);
			if (symbol && currentPrices[symbol]) {
				currency = currentPrices[symbol].currency;
			}
		}

		if (!distribution[asset.type]) {
			distribution[asset.type] = { value: 0, costBasis: 0, currency };
		}
		distribution[asset.type].value += currentValue;
		distribution[asset.type].costBasis += costBasis;
	});

	return Object.entries(distribution)
		.map(([type, { value, costBasis, currency }]) => ({
			type,
			value,
			costBasis,
			currency,
			percentage: totalValue > 0 ? parseFloat(((value / totalValue) * 100).toFixed(1)) : 0,
		}))
		.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Generate mock historical data for the portfolio chart.
 * Uses index-based x values (like AssetPriceChart) to avoid weekend gaps.
 */
function generateHistoricalData(
	period: string,
	currentValue: number,
): Array<{ x: number; y: number; extraData?: any }> {
	const now = new Date();
	let dataPoints: number;

	switch (period) {
		case "1W":
			dataPoints = 7;
			break;
		case "1M":
			dataPoints = 30;
			break;
		case "3M":
			dataPoints = 90;
			break;
		case "AAF": {
			// Year to date: from Jan 1 to today
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			dataPoints = Math.max(2, Math.ceil((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)));
			break;
		}
		case "1A":
			dataPoints = 365;
			break;
		case "ALL":
			dataPoints = 730;
			break;
		default:
			dataPoints = 30;
	}

	const volatility = 0.015;
	const trend = 0.0003;

	const data: Array<{ x: number; y: number; extraData?: any }> = [];
	let value = currentValue * (1 - trend * dataPoints);
	const msPerDay = 24 * 60 * 60 * 1000;

	for (let i = 0; i < dataPoints; i++) {
		const randomChange = (Math.random() - 0.5) * 2 * volatility;
		value = value * (1 + randomChange + trend);
		const date = new Date(now.getTime() - (dataPoints - i) * msPerDay);

		data.push({
			x: i,
			y: value,
			extraData: {
				formattedTime: formatDateShort(date),
			},
		});
	}

	return data;
}

export default function HomeScreen() {
	const { triggerHaptics } = useHaptics();
	const { user } = useSession();
	const [assets, setAssets] = useState<Asset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPeriod, setSelectedPeriod] = useState("1M");
	const [formattedValue, setFormattedValue] = useState("");
	useFocusEffect(
		useCallback(() => {
			loadAssets();
		}, [])
	);

	const loadAssets = async () => {
		try {
			const storedAssets = await getAssets();
			// Filter out fully sold assets for portfolio calculations
			setAssets(storedAssets.filter((a) => !isFullySold(a)));
		} catch (error) {
			console.error("Error loading assets:", error);
		} finally {
			setIsLoading(false);
		}
	};

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

	const portfolioValue = useMemo(() => calculatePortfolioValue(assets), [assets]);
	const assetDistribution = useMemo(() => getAssetTypeDistribution(assets, currentPrices), [assets, currentPrices]);

	// Format value to user's currency
	useEffect(() => {
		if (portfolioValue > 0) {
			transformNumberToUserCurrency(portfolioValue).then(setFormattedValue);
		} else {
			setFormattedValue(formatNumber(0, user?.currency ?? "USD"));
		}
	}, [portfolioValue, user?.currency]);

	const chartData = useMemo(() => {
		if (portfolioValue === 0) return [];
		return generateHistoricalData(selectedPeriod, portfolioValue);
	}, [selectedPeriod, portfolioValue]);

	const handlePeriodChange = useCallback(
		(period: string) => {
			triggerHaptics("Light");
			setSelectedPeriod(period);
		},
		[triggerHaptics],
	);

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="pt-safe">
				<View className="pt-5">
					<View className="px-5 mb-1">
						<Text className="text-foreground text-2xl font-lausanne-medium">
							Your Portfolio, {user?.firstName || "Investor"}
						</Text>
					</View>
					<View className="h-11 bg-foreground items-center justify-center">
						<MarqueeSymbols assets={assets} />
					</View>
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName="px-5 pb-10"
			>

				{/* Portfolio Chart + Period Selector */}
				<View className="mt-4 mb-8">
					<PortfolioChart
						data={chartData}
						isLoading={isLoading}
						currency={user?.currency ?? "USD"}
						currentValue={portfolioValue}
						formattedValue={formattedValue}
						selectedPeriod={selectedPeriod}
					/>
					<PeriodSelector
						options={PERIOD_OPTIONS}
						selected={selectedPeriod}
						onSelect={handlePeriodChange}
					/>
				</View>

				{/* Asset Allocation */}
				{assetDistribution.length > 0 && (
					<AssetDistribution
						distribution={assetDistribution}
					/>
				)}

				<NewsEvents assets={assets} />

			</ScrollView>
		</View>
	);
}
