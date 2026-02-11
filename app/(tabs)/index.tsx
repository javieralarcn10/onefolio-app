import { isFullySold, getNetQuantity, isQuantityBased, getAssetValue, getAssetSymbol, getAssetCurrentValue, LIVE_PRICE_TYPES, type PriceData } from "@/components/assets/asset-detail-helpers";
import { Asset } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { formatDateShort } from "@/utils/dates";
import { getAssets } from "@/utils/storage";
import {
	useCurrentPriceBulk,
	usePortfolioHistory,
	type PortfolioAssetPayload,
} from "@/utils/api/finance";
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

/** Portfolio value using live prices when available, cost basis as fallback */
function calculatePortfolioValue(
	assets: Asset[],
	currentPrices: Record<string, PriceData>,
): number {
	return assets.reduce(
		(total, asset) => total + getAssetCurrentValue(asset, currentPrices),
		0,
	);
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
 * Build the asset payload list for the portfolio-history endpoint.
 *
 * • Live-price assets → symbol + quantity (backend fetches price history).
 * • Interest-bearing assets → staticValue + interestRate / expectedReturn +
 *   maturityDate so the backend can compute daily accrual.
 * • Flat assets (cash, real estate) → staticValue only.
 */
function buildAssetPayloads(assets: Asset[]): PortfolioAssetPayload[] {
	return assets.map((asset): PortfolioAssetPayload => {
		const isLive = LIVE_PRICE_TYPES.has(asset.type);

		// ── Base fields (every asset) ────────────────────────────────────
		const base: PortfolioAssetPayload = {
			symbol: isLive ? getAssetSymbol(asset) : null,
			quantity: isQuantityBased(asset.type) ? getNetQuantity(asset) : null,
			purchaseDate: (asset as any).purchaseDate || asset.createdAt,
			type: asset.type,
			staticValue: isLive ? null : getAssetValue(asset),
			currency: asset.currency,
		};

		// ── Type-specific enrichment ─────────────────────────────────────
		switch (asset.type) {
			case "precious_metals":
				if (asset.format === "physical") {
					base.quantityUnit = asset.quantityUnit ?? "oz";
				}
				break;

			case "bonds":
				base.interestRate = asset.interestRate ?? null;
				base.maturityDate = asset.maturityDate ?? null;
				base.bondType = asset.bondType ?? null;
				break;

			case "deposits":
				base.interestRate = asset.interestRate ?? null;
				base.maturityDate = asset.maturityDate ?? null;
				break;

			case "private_investments":
				base.expectedReturn = asset.expectedReturn ?? null;
				base.maturityDate = asset.maturityDate ?? null;
				base.investmentType = asset.investmentType ?? null;
				break;
		}

		return base;
	});
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

	const portfolioValue = useMemo(
		() => calculatePortfolioValue(assets, currentPrices),
		[assets, currentPrices],
	);
	const assetDistribution = useMemo(() => getAssetTypeDistribution(assets, currentPrices), [assets, currentPrices]);

	// Format value to user's currency
	useEffect(() => {
		if (portfolioValue > 0) {
			transformNumberToUserCurrency(portfolioValue).then(setFormattedValue);
		} else {
			setFormattedValue(formatNumber(0, user?.currency ?? "USD"));
		}
	}, [portfolioValue, user?.currency]);

	// ── Portfolio chart data (real historical prices) ────────────────────
	const portfolioPayload = useMemo(() => {
		if (assets.length === 0) return null;
		return {
			assets: buildAssetPayloads(assets),
			period: selectedPeriod,
			targetCurrency: user?.currency ?? "USD",
		};
	}, [assets, selectedPeriod, user?.currency]);

	const { data: portfolioHistory, isLoading: isChartLoading } =
		usePortfolioHistory(portfolioPayload);

	const chartData = useMemo(() => {
		if (!portfolioHistory?.data?.length) return [];
		return portfolioHistory.data.map((point, index) => ({
			x: index,
			y: point.value,
			extraData: {
				formattedTime: formatDateShort(new Date(point.date)),
			},
		}));
	}, [portfolioHistory]);

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
						isLoading={isLoading || isChartLoading}
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
