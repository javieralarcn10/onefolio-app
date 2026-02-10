import { useMemo } from "react";
import { Text, View } from "react-native";
import { useQueries } from "@tanstack/react-query";
import Icon from "react-native-remix-icon";
import { Marquee } from "../marquee";
import { fetchCurrentPrice, CurrentPriceResponse } from "@/utils/api/finance";
import { Asset } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import Animated, { FadeIn } from "react-native-reanimated";

/** Default tickers shown when the user has no chartable assets */
const DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA", "BTC-USD", "GC=F"];

/** Extract the ticker / symbol used by the finance API */
function getAssetTicker(asset: Asset): string {
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

type MarqueeSymbolsProps = {
	assets: Asset[];
};

export function MarqueeSymbols({ assets }: MarqueeSymbolsProps) {
	// Extract unique tickers from chartable assets
	const tickers = useMemo(() => {
		const chartable = assets.filter(
			(a) => a.type === "stocks_etfs" || a.type === "crypto" || a.type === "precious_metals",
		);
		const unique = [...new Set(chartable.map(getAssetTicker).filter(Boolean))];
		return unique.length > 0 ? unique : DEFAULT_TICKERS;
	}, [assets]);

	// Fire all price requests in parallel — shares cache with useCurrentPrice
	const queries = useQueries({
		queries: tickers.map((symbol) => ({
			queryKey: ["current-price", symbol],
			queryFn: () => fetchCurrentPrice(symbol),
			staleTime: 15 * 60 * 1000,
			gcTime: 15 * 60 * 1000,
			retry: 1,
			enabled: symbol.length > 0,
		})),
	});

	// Wait until every query has settled (success or error) so the marquee
	// doesn't re-measure mid-animation when late responses arrive.
	const allSettled = queries.every((q) => !q.isLoading);

	// Only render items that have loaded successfully
	const items = useMemo(() => {
		if (!allSettled) return [];
		return queries
			.filter((q) => q.isSuccess && q.data)
			.map((q) => q.data as CurrentPriceResponse);
	}, [queries, allSettled]);

	if (items.length === 0) return null;

	return (
		<Animated.View entering={FadeIn.duration(400).delay(200)}>
			<Marquee spacing={48} speed={0.6}>
				<View className="flex-row items-center gap-12">
					{items.map((item) => (
						<MarqueeItem
							key={item.symbol}
							text={item.symbol}
							currency={item.currency}
							price={item.current_price}
							change={item.change_percent}
						/>
					))}
				</View>
			</Marquee>
		</Animated.View>
	);
}

const formatTickerName = (text: string) => {
	switch (text) {
		case "SI=F": return "Silver";
		case "GC=F": return "Gold";
		case "PL=F": return "Platinum";
		case "PA=F": return "Palladium";
		case "BTC-USD": return "Bitcoin";
		default: return `$${text}`;
	}
};

const MarqueeItem = ({ text, price, currency, change }: { text: string; price: number; currency: string; change: number }) => {
	return (
		<View className="flex-row items-center gap-2">
			<Text className="text-background font-lausanne-regular uppercase text-sm tracking-wide">
				{formatTickerName(text)}{"  |  "}
				<Text className="font-lausanne-regular text-sm tracking-wide">{formatNumber(price, currency)}</Text>
			</Text>
			<View className="flex-row items-center">
				{change > 0
					? <Icon name="arrow-up-s-fill" size={18} color="#22c55e" />
					: <Icon name="arrow-down-s-fill" size={18} color="#ef4444" />}
				<Text className={`font-lausanne-regular text-sm tracking-wide ${change > 0 ? "text-green-500" : "text-red-500"}`}>
					{change > 0 ? "+" : ""}{change.toFixed(2)}%
				</Text>
			</View>
		</View>
	);
};
