import { Colors } from "@/constants/colors";
import { Asset } from "@/types/custom";
import { getAssetValue } from "@/components/assets/asset-config";
import { getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { COUNTRIES } from "@/utils/countries";
import { useHaptics } from "@/hooks/haptics";
import { PAYWALL_RESULT, showPaywallIfNeeded } from "@/utils/revenue-cat";
import React, { useCallback, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Icon from "react-native-remix-icon";
import { formatNumber } from "@/utils/numbers";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { BlurView } from "expo-blur";

type PriceData = { price: number; currency: string };

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

type CountryData = {
	name: string;
	code: string | null;
	value: number;
	percentage: number;
	continent: string;
};

type ContinentGroup = {
	name: string;
	percentage: number;
	countries: CountryData[];
};

/** Order continents for display */
const CONTINENT_ORDER = ["North America", "Europe", "Asia", "South America", "Africa", "Oceania", "Global"];

/** Extract the country name from an asset, or null if it has none */
function getAssetCountry(asset: Asset): string | null {
	switch (asset.type) {
		case "stocks_etfs":
			return asset.country || null;
		case "bonds":
			return asset.bondCountry || null;
		case "real_estate":
			return asset.country || null;
		default:
			return null;
	}
}

/** Look up a two-letter ISO code from a country name */
function findCountryCode(name: string): string | null {
	const lower = name.toLowerCase().trim();
	const match = COUNTRIES.find((c) => c.name.toLowerCase() === lower);
	return match?.code ?? null;
}

/** Get continent for a country code */
function getContinent(code: string | null): string {
	if (!code) return "Global";
	return COUNTRIES.find((c) => c.code === code)?.continent ?? "Global";
}

type GeographicExposureProps = {
	assets: Asset[];
	isPremium: boolean;
	userCurrency: string;
	currentPrices: Record<string, PriceData>;
};

export const GeographicExposure = React.memo(function GeographicExposure({ assets, isPremium, userCurrency, currentPrices }: GeographicExposureProps) {
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

	const { continents } = useMemo(() => {
		// ── Aggregate value per country ──────────────────────────
		const countryMap = new Map<string, number>();
		let totalValue = 0;

		for (const asset of assets) {
			const value = getAssetCurrentValue(asset, currentPrices);
			if (value <= 0) continue;

			totalValue += value;
			const rawCountry = getAssetCountry(asset);
			const label = rawCountry?.trim() || "Global";

			countryMap.set(label, (countryMap.get(label) ?? 0) + value);
		}

		// ── Build country list with continent ───────────────────
		const list: CountryData[] = [];
		for (const [name, value] of countryMap) {
			const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
			const code = name === "Global" ? null : findCountryCode(name);
			list.push({
				name,
				code,
				value,
				percentage: pct,
				continent: name === "Global" ? "Global" : getContinent(code),
			});
		}

		// ── Group by continent ──────────────────────────────────
		const groupMap = new Map<string, CountryData[]>();
		for (const country of list) {
			const existing = groupMap.get(country.continent) ?? [];
			existing.push(country);
			groupMap.set(country.continent, existing);
		}

		const groups: ContinentGroup[] = [];
		for (const continentName of CONTINENT_ORDER) {
			const countries = groupMap.get(continentName);
			if (!countries) continue;
			countries.sort((a, b) => b.percentage - a.percentage);
			const continentPct = countries.reduce((sum, c) => sum + c.percentage, 0);
			groups.push({ name: continentName, percentage: continentPct, countries });
		}
		return { continents: groups };
	}, [assets, currentPrices]);

	if (continents.length === 0) return null;

	return (
		<View className="mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Geographic Exposure</Text>

			<View className="bg-input border border-border" style={{ position: "relative" }}>
				{continents.map((group, groupIdx) => (
					<View
						key={group.name}
						className={groupIdx > 0 ? "border-t border-border" : ""}
					>
						{/* Continent header */}
						<View className="flex-row items-center justify-between px-4 py-3 bg-secondary">
							<Text className="text-foreground text-xs font-lausanne-semibold uppercase tracking-wider">
								{group.name}
							</Text>
							<Text className="text-foreground text-xs font-lausanne-medium">
								{formatNumber(group.percentage)}%
							</Text>
						</View>

						{/* Countries in this continent */}
						<View className="p-4 gap-5">
							{group.countries.map((item) => (
								<View key={item.name} className="gap-2">
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2">
											{item.code ? (
												<Image source={{ uri: item.code }} style={{ width: 26, height: 16 }} />
											) : (
												<View className="bg-indigo-600 flex-row items-center justify-center" style={{ width: 27, height: 18 }}>
													<Icon name="global-line" size="13" color={Colors.background} fallback={null} />
												</View>
											)}
											<Text className="text-foreground text-sm font-lausanne-medium">
												{item.name}{" · "}{formatNumber(item.percentage)}%
											</Text>
										</View>
										<Text className="text-muted-foreground text-sm font-lausanne-medium">
											{formatNumber(item.value, userCurrency)}
										</Text>
									</View>

									<View className="h-2 bg-secondary overflow-hidden w-full">
										<View
											className="h-full bg-foreground"
											style={{ width: `${item.percentage}%` }}
										/>
									</View>
								</View>
							))}
						</View>
					</View>
				))}

				{!isPremium && (
					<BlurView intensity={60} tint="light" experimentalBlurMethod="dimezisBlurView" className="absolute inset-0 flex-1 flex-col justify-center items-center">
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
