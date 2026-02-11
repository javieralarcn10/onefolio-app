import { Colors } from "@/constants/colors";
import { formatRelative } from "@/utils/dates";
import { useNewsBulk, NewsItem as APINewsItem } from "@/utils/api/finance";
import { Asset } from "@/types/custom";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";

/** Default tickers used when the user has no chartable assets */
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

type NewsEventsProps = {
	assets: Asset[];
};

const EXAMPLE_YOUTUBE_NEWS = [
	{
		title: "Cornered? Tensions Rise Between the U.S. and Iran—Why Does Trump Refuse to Attack?",
		publisher: "VisualPolitik EN",
		link: "https://www.youtube.com/watch?v=Z1snRxy-EgA",
		date: "2026-02-09T12:00:00Z",
		summary: "An analysis of escalating tensions between the United States and Iran, exploring the geopolitical factors and strategic considerations behind Trump's decision to avoid military confrontation despite mounting pressure.",
	},
];

export function NewsEvents({ assets }: NewsEventsProps) {
	// Extract unique tickers from chartable assets
	const tickers = useMemo(() => {
		const chartable = assets.filter(
			(a) => a.type === "stocks_etfs" || a.type === "crypto" || a.type === "precious_metals",
		);
		const unique = [...new Set(chartable.map(getAssetTicker).filter(Boolean))];
		return unique.length > 0 ? unique : DEFAULT_TICKERS;
	}, [assets]);

	// Fetch all news in a single bulk request
	const symbolsParam = useMemo(() => tickers.join(","), [tickers]);
	const { data: bulkNews } = useNewsBulk(symbolsParam, tickers.length > 0);

	// Merge, deduplicate by link, and sort by date (newest first)
	const news = useMemo(() => {
		if (!bulkNews) return [];
		const all: APINewsItem[] = [];
		for (const symbol of tickers) {
			const data = bulkNews[symbol];
			if (data) {
				all.push(...data.news.slice(0, 3));
			}
		}
		// Deduplicate by link
		const seen = new Set<string>();
		const unique = all.filter((item) => {
			if (seen.has(item.link)) return false;
			seen.add(item.link);
			return true;
		});
		// return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
		return EXAMPLE_YOUTUBE_NEWS.concat(unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10));
	}, [bulkNews, tickers]);

	if (news.length === 0) return null;

	return (
		<View>
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">News & Events</Text>

			<FlatList
				showsVerticalScrollIndicator={false}
				data={news.slice(0, 10)}
				keyExtractor={(item: APINewsItem) => item.link}
				renderItem={({ item, index }: { item: APINewsItem; index: number }) => (
					<NewsItemRow
						item={item}
						index={index}
						isLast={index === news.slice(0, 10).length - 1}
					/>
				)}
				scrollEnabled={false}
				contentContainerClassName="gap-2"
			/>
		</View>
	);
}

const NewsItemRow = ({ item, index, isLast }: { item: APINewsItem; index: number; isLast: boolean }) => {
	const handlePress = () => {
		Linking.openURL(item.link);
	};

	return (
		<Pressable
			key={index}
			onPress={handlePress}
			className={`flex-row items-center justify-between py-4 ${isLast ? "" : "border-b border-border"}`}>
			<View className="flex-row items-center gap-4 flex-1">

				<View className="flex-row items-start gap-3 flex-1">
					<Image
						source={{ uri: `https://www.google.com/s2/favicons?domain=${item.link}&sz=128` }}
						style={{ width: 36, height: 36, marginTop: 2, borderRadius: 99 }}
						contentFit="cover"
					/>
					<View className="flex-1 gap-1.5">
						<Text numberOfLines={2} className="font-lausanne-medium text-foreground text-base leading-tight">
							{item.title}
						</Text>
						<Text numberOfLines={2} className="font-lausanne-light text-muted-foreground text-sm leading-snug">
							{item.summary}
						</Text>
						<Text className="font-lausanne-light text-muted-foreground text-xs mt-0.5">
							{item.publisher} · {formatRelative(item.date)}
						</Text>
					</View>
				</View>
				<Icon name="arrow-right-s-line" size="20" color={Colors.foreground} fallback={null} className="mt-1" />
			</View>
		</Pressable>
	);
};
