import { Colors } from "@/constants/colors";
import { useAssetSearch, SearchResult } from "@/utils/api/finance";
import { formatNumber } from "@/utils/numbers";
import { EraserIcon } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Icon from "react-native-remix-icon";

type AssetSearchProps = {
	type: "stock" | "crypto";
	selectedSymbol: string | null;
	selectedName: string | null;
	onSelect: (
		symbol: string, 
		name: string, 
		tickerType: string | null,
		sector?: string,
		industry?: string,
		country?: string,
		exchange?: string
	) => void;
	onClear: () => void;
	disabled?: boolean;
};

const DEBOUNCE_MS = 350;

export function AssetSearch({
	type,
	selectedSymbol,
	selectedName,
	onSelect,
	onClear,
	disabled = false,
}: AssetSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const apiType = type === "stock" ? "stocks" as const : "crypto" as const;
	const { data: results = [], isFetching, isError, error } = useAssetSearch(debouncedQuery, apiType);

	// Debounce the search query
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		if (!searchQuery.trim()) {
			setDebouncedQuery("");
			return;
		}

		debounceRef.current = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [searchQuery]);

	const handleSelect = (item: SearchResult) => {
		onSelect(
			item.symbol, 
			item.name, 
			item.type === 'Equity' ? 'Stock' : item.type,
			item.sector,
			item.industry,
			item.country,
			item.exchange
		);
		setSearchQuery("");
		setDebouncedQuery("");
		setIsFocused(false);
	};

	// If already selected, show the selected item
	if (selectedSymbol && selectedName) {
		return (
			<View className="mb-5">
				<Text className="font-lausanne-regular text-foreground text-sm mb-2">
					{type === "stock" ? "Stock / ETF" : "Cryptocurrency"}
					<Text className="text-red-700"> *</Text>
				</Text>
				<View className="flex-row items-center justify-between border border-foreground p-3 bg-secondary">
					<View className="flex-1">
						<Text className="font-lausanne-medium text-foreground text-base">
							{selectedSymbol}
						</Text>
						<Text className="font-lausanne-light text-muted-foreground text-sm">
							{selectedName}
						</Text>
					</View>
					{!disabled && (
						<Pressable
							onPress={onClear}
							className="p-2"
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<EraserIcon color={Colors.foreground} weight="duotone" size={20} />
						</Pressable>
					)}
				</View>
			</View>
		);
	}

	return (
		<View className="mb-5">
			<Text className="font-lausanne-regular text-foreground text-sm mb-2">
				{type === "stock" ? "Search Stock / ETF" : "Search Cryptocurrency"}
				<Text className="text-red-700"> *</Text>
			</Text>

			{/* Search Input */}
			<View className="flex-row items-center gap-2 border-b border-foreground">
				<Icon name="search-line" size="17" color={Colors.placeholder} fallback={null} />
				<TextInput
					autoCorrect={false}
					onChangeText={setSearchQuery}
					value={searchQuery}
					allowFontScaling={false}
					enterKeyHint="search"
					placeholder={type === "stock" ? "e.g., AAPL, Apple, VOO..." : "e.g., BTC, Bitcoin, ETH..."}
					placeholderTextColor={Colors.placeholder}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setTimeout(() => setIsFocused(false), 200)}
					className="flex-grow text-foreground font-lausanne-light"
					style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
				/>
				{isFetching && (
					<ActivityIndicator size="small" color={Colors.foreground} />
				)}
			</View>

			{/* Results */}
			{isFocused && results.length > 0 && (
				<View className="border border-border border-t-0 border-b-0 bg-[#f2f2f2] absolute top-full left-0 right-0 z-10">
					{results.map((item) => (
						<Pressable
							key={item.symbol}
							onPress={() => handleSelect(item)}
							className="flex-row items-center justify-between gap-6 px-3 py-3 border-b border-border"
						>
							<View className="flex-1">
								<Text className="font-lausanne-medium text-foreground text-base">
									{item.symbol}
								</Text>
								<Text
									className="font-lausanne-light text-muted-foreground text-sm"
									numberOfLines={1}
								>
									{item.name}
								</Text>
							</View>
							<Text className="font-lausanne-medium text-foreground text-base">
								{formatNumber(item.price, item.currency)}
							</Text>
						</Pressable>
					))}
				</View>
			)}

			{/* Error message */}
			{isFocused && isError && !isFetching && (
				<View className="border border-border border-t-0 px-3 py-4 bg-[#f2f2f2]">
					<Text className="font-lausanne-light text-red-600 text-sm text-center">
						{error instanceof Error ? error.message : "Search failed"}
					</Text>
				</View>
			)}

			{/* No results message */}
			{isFocused && debouncedQuery && !isFetching && !isError && results.length === 0 && (
				<View className="border border-border border-t-0 px-3 py-4 bg-[#f2f2f2]">
					<Text className="font-lausanne-light text-muted-foreground text-sm text-center">
						No results found for "{searchQuery}"
					</Text>
				</View>
			)}
		</View>
	);
}
