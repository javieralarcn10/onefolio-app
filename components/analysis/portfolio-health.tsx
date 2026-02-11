import { Colors } from "@/constants/colors";
import { Asset, AssetType } from "@/types/custom";
import { getAssetValue, getNetQuantity, getAssetSymbol, getAssetCurrentValue, LIVE_PRICE_TYPES, type PriceData } from "@/components/assets/asset-detail-helpers";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import Icon, { IconName } from "react-native-remix-icon";

type RiskLevel = "low" | "moderate" | "high";

type RiskCategory = {
	title: string;
	description: string;
	score: number;
	level: RiskLevel;
	icon: IconName;
};

type Props = {
	assets: Asset[];
	currentPrices: Record<string, PriceData>;
};

const LEVEL_CONFIG: Record<RiskLevel, { bg: string; color: string; bar: string; label: string }> = {
	low: { bg: "#E8F5E9", color: "#1B5E20", bar: "#2E7D32", label: "Low Risk" },
	moderate: { bg: "#FFFBEA", color: "#D97706", bar: "#F59E0B", label: "Moderate" },
	high: { bg: "#FFEBEE", color: "#B71C1C", bar: "#C62828", label: "High Risk" },
};

function getLevel(score: number): RiskLevel {
	if (score >= 70) return "low";
	if (score >= 40) return "moderate";
	return "high";
}

// ── Risk score calculations ──────────────────────────────────────────────

/**
 * HHI-based diversification score.
 * More items + even distribution → higher score (less concentrated = less risk).
 */
function diversificationScore(percentages: number[]): number {
	if (percentages.length === 0) return 0;
	if (percentages.length === 1) return 15; // fully concentrated

	const hhi = percentages.reduce((sum, p) => sum + (p / 100) ** 2, 0);
	const n = percentages.length;
	const minHHI = 1 / n;
	const maxHHI = 1;

	if (maxHHI <= minHHI) return 95;

	const normalized = (maxHHI - hhi) / (maxHHI - minHHI);
	return Math.round(Math.max(5, Math.min(95, normalized * 85 + 10)));
}

function computeGeographicScore(assets: Asset[], currentPrices: Record<string, PriceData>): number {
	const countryMap = new Map<string, number>();
	let totalValue = 0;

	for (const asset of assets) {
		const value = getAssetCurrentValue(asset, currentPrices);
		if (value <= 0) continue;
		totalValue += value;

		let country = "Global";
		if (asset.type === "stocks_etfs" && asset.country) country = asset.country;
		else if (asset.type === "bonds" && asset.bondCountry) country = asset.bondCountry;
		else if (asset.type === "real_estate" && asset.country) country = asset.country;

		countryMap.set(country, (countryMap.get(country) ?? 0) + value);
	}

	if (totalValue === 0) return 0;
	const pcts = Array.from(countryMap.values()).map((v) => (v / totalValue) * 100);
	return diversificationScore(pcts);
}

function computeCurrencyScore(assets: Asset[], currentPrices: Record<string, PriceData>): number {
	const currencyMap = new Map<string, number>();
	let totalValue = 0;

	for (const asset of assets) {
		const value = getAssetCurrentValue(asset, currentPrices);
		if (value <= 0) continue;
		totalValue += value;

		let currency = asset.currency || "USD";
		if (LIVE_PRICE_TYPES.has(asset.type)) {
			const symbol = getAssetSymbol(asset);
			if (symbol && currentPrices[symbol]) {
				currency = currentPrices[symbol].currency;
			}
		}

		currencyMap.set(currency, (currencyMap.get(currency) ?? 0) + value);
	}

	if (totalValue === 0) return 0;
	const pcts = Array.from(currencyMap.values()).map((v) => (v / totalValue) * 100);
	return diversificationScore(pcts);
}

function computeSectorScore(assets: Asset[], currentPrices: Record<string, PriceData>): number {
	const sectorMap = new Map<string, number>();
	let totalValue = 0;

	for (const asset of assets) {
		const value = getAssetCurrentValue(asset, currentPrices);
		if (value <= 0) continue;
		totalValue += value;

		let sector: string;
		switch (asset.type) {
			case "stocks_etfs":
				sector = asset.sector || (asset.tickerType?.toLowerCase() === "etf" ? "ETFs" : "Other Stocks");
				break;
			case "crypto":
				sector = "Cryptocurrency";
				break;
			case "real_estate":
				sector = "Real Estate";
				break;
			case "precious_metals":
				sector = "Precious Metals";
				break;
			case "bonds":
				sector = asset.bondType === "government" ? "Government Bonds" : "Corporate Bonds";
				break;
			case "deposits":
			case "cash":
				sector = "Cash & Deposits";
				break;
			case "private_investments":
				sector = "Alternative Investments";
				break;
			default:
				sector = "Other";
		}

		sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + value);
	}

	if (totalValue === 0) return 0;
	const pcts = Array.from(sectorMap.values()).map((v) => (v / totalValue) * 100);
	return diversificationScore(pcts);
}

/** Liquidity weight per asset type (0–100) */
const LIQUIDITY_WEIGHTS: Record<AssetType, number> = {
	cash: 98,
	deposits: 82,
	stocks_etfs: 90,
	crypto: 78,
	bonds: 55,
	precious_metals: 60,
	real_estate: 18,
	private_investments: 15,
};

function computeLiquidityScore(assets: Asset[], currentPrices: Record<string, PriceData>): number {
	let totalValue = 0;
	let weightedScore = 0;

	for (const asset of assets) {
		const value = getAssetCurrentValue(asset, currentPrices);
		if (value <= 0) continue;
		totalValue += value;

		let weight = LIQUIDITY_WEIGHTS[asset.type] ?? 50;
		if (asset.type === "precious_metals" && asset.format === "physical") {
			weight = 35;
		}

		weightedScore += value * weight;
	}

	return totalValue > 0 ? Math.round(weightedScore / totalValue) : 0;
}

// ── Main component ───────────────────────────────────────────────────────

export const PortfolioHealth = React.memo(function PortfolioHealth({ assets, currentPrices }: Props) {
	const { categories, overallScore, overallLevel } = useMemo(() => {
		const geo = computeGeographicScore(assets, currentPrices);
		const cur = computeCurrencyScore(assets, currentPrices);
		const sec = computeSectorScore(assets, currentPrices);
		const liq = computeLiquidityScore(assets, currentPrices);

		const cats: RiskCategory[] = [
			{
				title: "Geographic",
				description: "Country diversification",
				score: geo,
				level: getLevel(geo),
				icon: "global-line" as const,
			},
			{
				title: "Currency",
				description: "Currency diversification",
				score: cur,
				level: getLevel(cur),
				icon: "exchange-dollar-line" as const,
			},
			{
				title: "Sector",
				description: "Industry diversification",
				score: sec,
				level: getLevel(sec),
				icon: "pie-chart-2-line" as const,
			},
			{
				title: "Liquidity",
				description: "Asset convertibility",
				score: liq,
				level: getLevel(liq),
				icon: "water-flash-line" as const,
			},
		];

		const averageScore = Math.round((geo + cur + sec + liq) / 4);

		return {
			categories: cats,
			overallScore: averageScore,
			overallLevel: getLevel(averageScore),
		};
	}, [assets, currentPrices]);

	return (
		<View className="mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Portfolio Health</Text>

			<View className="bg-input border border-border">
				<View className="flex-row flex-wrap">
					{categories.map((item, index) => {
						const config = LEVEL_CONFIG[item.level];
						const isRightColumn = index % 2 === 1;
						const isBottomRow = index > 1;

						return (
							<View
								key={item.title}
								className={`w-1/2 px-4 py-4 ${!isRightColumn ? "border-r border-border" : ""} ${isBottomRow ? "border-t border-border" : ""}`}
							>
								<View className="flex-row items-center justify-between mb-4">
									<View className="w-10 h-10 bg-secondary items-center justify-center">
										<Icon name={item.icon} size="18" color={Colors.foreground} fallback={null} />
									</View>
									<View className="flex-row items-end">
										<Text className="text-foreground text-2xl font-lausanne-bold">{item.score}</Text>
										<Text className="text-foreground text-xs font-lausanne-semibold">/100</Text>
									</View>
								</View>

								<Text className="text-foreground text-sm font-lausanne-medium">{item.title}</Text>
								<Text className="text-muted-foreground text-xs font-lausanne-light">
									{item.description}
								</Text>

								<View className="mt-4 h-1.5 bg-secondary overflow-hidden">
									<View
										className="h-full"
										style={{ width: `${item.score}%`, backgroundColor: config.bar }}
									/>
								</View>

								<Text className="text-xs font-lausanne-medium mt-1.5" style={{ color: config.color }}>
									{config.label}
								</Text>
							</View>
						);
					})}
				</View>
			</View>
		</View>
	);
});
