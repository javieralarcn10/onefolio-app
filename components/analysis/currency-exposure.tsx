import { Colors } from "@/constants/colors";
import { Asset } from "@/types/custom";
import { getAssetValue } from "@/components/assets/asset-config";
import { getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { formatNumber } from "@/utils/numbers";
import { useHaptics } from "@/hooks/haptics";
import { PAYWALL_RESULT, showPaywallIfNeeded } from "@/utils/revenue-cat";
import React, { useCallback, useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Icon from "react-native-remix-icon";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { BlurView } from "expo-blur";

type PriceData = { price: number; currency: string };

const LIVE_PRICE_TYPES = new Set(["stocks_etfs", "crypto", "precious_metals"]);

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

function getAssetCurrentValue(asset: Asset, currentPrices: Record<string, PriceData>): number {
	if (LIVE_PRICE_TYPES.has(asset.type)) {
		const symbol = getAssetSymbol(asset);
		if (symbol && currentPrices[symbol]) {
			return getNetQuantity(asset) * currentPrices[symbol].price;
		}
	}
	return getAssetValue(asset);
}

const CURRENCY_INFO: Record<string, { name: string; symbol: string }> = {
	USD: { name: "US Dollar", symbol: "$" },
	EUR: { name: "Euro", symbol: "€" },
	GBP: { name: "British Pound", symbol: "£" },
	CHF: { name: "Swiss Franc", symbol: "Fr" },
	JPY: { name: "Japanese Yen", symbol: "¥" },
	CAD: { name: "Canadian Dollar", symbol: "C$" },
	AUD: { name: "Australian Dollar", symbol: "A$" },
	MXN: { name: "Mexican Peso", symbol: "MX$" },
	BRL: { name: "Brazilian Real", symbol: "R$" },
};

const PALETTE = [
	"#1A1A2E",
	"#16537E",
	"#C17817",
	"#9E3B3B",
	"#4A7C59",
	"#7B6079",
	"#2E6E6E",
	"#5B4A8A",
	"#8B6F47",
	"#3D5A80",
];

/* ── Chart constants ───────────────────────────────────────── */
const CHART_HEIGHT = 130;
const BAR_GAP = 8;
const MAX_BAR_WIDTH = 56;
const HATCH_SIZE = 7;
const HATCH_STROKE = 1.3;

type CurrencyExposureProps = {
	assets: Asset[];
	isPremium: boolean;
	currentPrices: Record<string, PriceData>;
};

export const CurrencyExposure = React.memo(function CurrencyExposure({ assets, isPremium, currentPrices }: CurrencyExposureProps) {
	const { width: screenWidth } = useWindowDimensions();
	const { triggerHaptics } = useHaptics();

	const upgradeButtonScale = useSharedValue(1);

	const upgradeButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: upgradeButtonScale.value }],
	}));

	const handleUpgradeButtonPressIn = () => {
		upgradeButtonScale.value = withTiming(0.98, { duration: 100, easing: Easing.out(Easing.ease) });
	};

	const handleUpgradeButtonPressOut = () => {
		upgradeButtonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
	};

	const handleUpgradePress = useCallback(async () => {
		triggerHaptics("Soft");
		const result = await showPaywallIfNeeded();
		if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
			triggerHaptics("Success");
		}
	}, [triggerHaptics]);

	const currencies = useMemo(() => {
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

		return Array.from(currencyMap.entries())
			.map(([code, value]) => ({
				code,
				name: CURRENCY_INFO[code]?.name ?? code,
				symbol: CURRENCY_INFO[code]?.symbol ?? code,
				value,
				percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
			}))
			.sort((a, b) => b.percentage - a.percentage)
			.map((item, index) => ({
				...item,
				color: PALETTE[index % PALETTE.length],
			}));
	}, [assets, currentPrices]);

	if (currencies.length === 0) return null;

	// ── Bar sizing ──────────────────────────────────────────────
	// px-5 on ScrollView (40) + p-4 on card (32) + border (2)
	const cardInner = screenWidth - 40 - 32 - 2;
	const barCount = currencies.length;
	const rawBarWidth = (cardInner - (barCount - 1) * BAR_GAP) / barCount;
	const barWidth = Math.min(rawBarWidth, MAX_BAR_WIDTH);
	const totalChartWidth = barCount * barWidth + (barCount - 1) * BAR_GAP;
	return (
		<View className="mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Currency Exposure</Text>

			<View className="bg-input border border-border p-4 overflow-hidden">
				{/* ── Percentage labels (above bars) ──────────────────── */}
				<View className="flex-row justify-center mb-1.5" style={{ gap: BAR_GAP }}>
					{currencies.map((item) => (
						<View key={item.code} style={{ width: barWidth, alignItems: "center" }}>
							<Text className="text-foreground text-xs font-lausanne-semibold">
								{formatNumber(item.percentage)}%
							</Text>
						</View>
					))}
				</View>

				{/* ── SVG vertical bars with diagonal stripes ─────────── */}
				<View className="items-center">
					<Svg width={totalChartWidth} height={CHART_HEIGHT}>
						<Defs>
							{currencies.map((item) => (
								<Pattern
									key={item.code}
									id={`hatch-${item.code}`}
									width={HATCH_SIZE}
									height={HATCH_SIZE}
									patternUnits="userSpaceOnUse"
								>
									<Rect
										width={HATCH_SIZE}
										height={HATCH_SIZE}
										fill={item.color}
										opacity={0.08}
									/>
									<Path
										d={`M-1,1 l2,-2 M0,${HATCH_SIZE} l${HATCH_SIZE},-${HATCH_SIZE} M${HATCH_SIZE - 1},${HATCH_SIZE + 1} l2,-2`}
										stroke={item.color}
										strokeWidth={HATCH_STROKE}
										opacity={0.55}
									/>
								</Pattern>
							))}
						</Defs>

						{currencies.map((item, i) => {
							const x = i * (barWidth + BAR_GAP);
							const barHeight = (item.percentage / 100) * CHART_HEIGHT;
							const y = CHART_HEIGHT - barHeight;

							return (
								<React.Fragment key={item.code}>
									{/* Ghost column (full height, very faint) */}
									<Rect
										x={x}
										y={0}
										width={barWidth}
										height={CHART_HEIGHT}
										fill={item.color}
										opacity={0.06}
									/>
									{/* Striped fill */}
									<Rect
										x={x}
										y={y}
										width={barWidth}
										height={barHeight}
										fill={`url(#hatch-${item.code})`}
									/>
								</React.Fragment>
							);
						})}
					</Svg>
				</View>

				{/* ── Currency code labels (below bars) ───────────────── */}
				<View className="flex-row justify-center mt-2" style={{ gap: BAR_GAP }}>
					{currencies.map((item) => (
						<View key={item.code} style={{ width: barWidth, alignItems: "center" }}>
							<Text className="text-foreground text-xs font-lausanne-bold">
								{item.code}
							</Text>
							<Text className="text-muted-foreground text-[10px] font-lausanne-light">
								{item.symbol}
							</Text>
						</View>
					))}
				</View>

				{/* ── Divider ────────────────────────────────────────── */}
				<View className="h-px border-b border-border my-4" />

				{/* ── Detail legend ───────────────────────────────────── */}
				<View className="gap-3">
					{currencies.map((item) => (
						<View key={item.code} className="flex-row items-center">
							<View
								className="w-3 h-3 mr-3"
								style={{ backgroundColor: item.color }}
							/>
							<View className="flex-1 flex-row items-center justify-between">
								<Text className="text-foreground text-sm font-lausanne-medium">
									{item.code}
									<Text className="text-muted-foreground font-lausanne-light">
										{" · "}{item.name}
									</Text>
								</Text>
								<Text className="text-muted-foreground text-sm font-lausanne-light">
									{formatNumber(item.value, item.code)}
								</Text>
							</View>
						</View>
					))}
				</View>

				{!isPremium && (
					<BlurView intensity={30} tint="light" experimentalBlurMethod="dimezisBlurView" className="absolute inset-0 flex-1 flex-col justify-center items-center">
						<View className="flex-1 flex-col justify-center items-center">
							<Text className="text-foreground text-lg font-lausanne-medium mb-2">Unlock Premium to see the full view</Text>
							<Animated.View style={[upgradeButtonAnimatedStyle]}>
								<Pressable
									onPress={handleUpgradePress}
									onPressIn={handleUpgradeButtonPressIn}
									onPressOut={handleUpgradeButtonPressOut}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									className="bg-accent px-3 py-1.5 flex-row items-center gap-1">
									<Text className="text-foreground text-sm font-lausanne-medium">Upgrade</Text>
									<Icon name="arrow-right-up-line" size="17" color={Colors.foreground} fallback={null} />
								</Pressable>
							</Animated.View>
						</View>
					</BlurView>
				)}
			</View>
		</View>
	);
});
