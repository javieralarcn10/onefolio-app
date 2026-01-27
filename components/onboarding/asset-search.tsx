import { Colors } from "@/constants/colors";
import { EraserIcon, MagnifyingGlassIcon, XIcon } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

// Mock data for stocks - in production this would come from an API
const MOCK_STOCKS = [
	{ ticker: "AAPL", name: "Apple Inc." },
	{ ticker: "MSFT", name: "Microsoft Corporation" },
	{ ticker: "GOOGL", name: "Alphabet Inc." },
	{ ticker: "AMZN", name: "Amazon.com Inc." },
	{ ticker: "NVDA", name: "NVIDIA Corporation" },
	{ ticker: "META", name: "Meta Platforms Inc." },
	{ ticker: "TSLA", name: "Tesla Inc." },
	{ ticker: "VOO", name: "Vanguard S&P 500 ETF" },
	{ ticker: "VTI", name: "Vanguard Total Stock Market ETF" },
	{ ticker: "SPY", name: "SPDR S&P 500 ETF Trust" },
	{ ticker: "QQQ", name: "Invesco QQQ Trust" },
	{ ticker: "NFLX", name: "Netflix Inc." },
];

// Mock data for crypto
const MOCK_CRYPTO = [
	{ symbol: "BTC", name: "Bitcoin" },
	{ symbol: "ETH", name: "Ethereum" },
	{ symbol: "SOL", name: "Solana" },
	{ symbol: "BNB", name: "Binance Coin" },
	{ symbol: "XRP", name: "Ripple" },
	{ symbol: "ADA", name: "Cardano" },
	{ symbol: "DOGE", name: "Dogecoin" },
	{ symbol: "DOT", name: "Polkadot" },
	{ symbol: "AVAX", name: "Avalanche" },
	{ symbol: "MATIC", name: "Polygon" },
	{ symbol: "LINK", name: "Chainlink" },
	{ symbol: "UNI", name: "Uniswap" },
];

type AssetSearchProps = {
	type: "stock" | "crypto";
	selectedSymbol: string | null;
	selectedName: string | null;
	onSelect: (symbol: string, name: string) => void;
	onClear: () => void;
};

export function AssetSearch({
	type,
	selectedSymbol,
	selectedName,
	onSelect,
	onClear,
}: AssetSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	const data = type === "stock" ? MOCK_STOCKS : MOCK_CRYPTO;
	const symbolKey = type === "stock" ? "ticker" : "symbol";

	const filteredResults = searchQuery.trim()
		? data.filter(
			(item) =>
				(item as any)[symbolKey].toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: [];

	const handleSelect = (item: { ticker?: string; symbol?: string; name: string }) => {
		const sym = type === "stock" ? (item as any).ticker : (item as any).symbol;
		onSelect(sym, item.name);
		setSearchQuery("");
		setIsFocused(false);
	};

	// If already selected, show the selected item
	if (selectedSymbol && selectedName) {
		return (
			<View className="mb-5">
				<Text className="font-lausanne-regular text-foreground text-sm mb-2">
					{type === "stock" ? "Stock / ETF" : "Cryptocurrency"}
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
					<Pressable
						onPress={onClear}
						className="p-2"
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<EraserIcon color={Colors.foreground} weight="duotone" size={20} />
					</Pressable>
				</View>
			</View>
		);
	}

	return (
		<View className="mb-5">
			<Text className="font-lausanne-regular text-foreground text-sm mb-2">
				{type === "stock" ? "Search Stock / ETF" : "Search Cryptocurrency"}
			</Text>

			{/* Search Input */}
			<View className="flex-row items-center gap-2 border-b border-foreground">
				<MagnifyingGlassIcon color={Colors.placeholder} size={18} />
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
			</View>

			{/* Results */}
			{isFocused && filteredResults.length > 0 && (
				<View className="border border-border border-t-0 border-b-0 bg-secondary absolute top-full left-0 right-0 z-10">
					{filteredResults.map((item) => {
						const sym = type === "stock" ? (item as any).ticker : (item as any).symbol;
						return (
							<Pressable
								key={sym}
								onPress={() => handleSelect(item)}
								className="flex-row items-center justify-between px-3 py-3 border-b border-border"
							>
								<Text className="font-lausanne-medium text-foreground text-base">
									{sym}
								</Text>
								<Text className="font-lausanne-light text-muted-foreground text-sm flex-1 text-right">
									{item.name}
								</Text>
							</Pressable>
						);
					})}
				</View>
			)}

			{/* No results message */}
			{isFocused && searchQuery.trim() && filteredResults.length === 0 && (
				<View className="border border-border border-t-0 px-3 py-4 bg-secondary">
					<Text className="font-lausanne-light text-muted-foreground text-sm text-center">
						No results found for "{searchQuery}"
					</Text>
				</View>
			)}
		</View>
	);
}
