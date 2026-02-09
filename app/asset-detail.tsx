import { Colors } from "@/constants/colors";
import { Asset, Transaction, TransactionType } from "@/types/custom";
import { getAssets, addTransactionToAsset } from "@/utils/storage";
import { usePriceHistory, PriceHistoryPoint, useAnalystRating, useCurrentPrice } from "@/utils/api/finance";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { useHaptics } from "@/hooks/haptics";
import { getAssetValue } from "@/components/assets/asset-config";
import { DetailsSection, InformationSection } from "@/components/assets/details-section";
import { AssetActions } from "@/components/assets/asset-actions";
import { AssetPriceChart } from "@/components/assets/asset-price-chart";
import { PeriodSelector, PeriodOption } from "@/components/assets/period-selector";
import { TransactionModal } from "@/components/assets/transaction-modal";
import { supportsLiveChart, getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { formatDateTime } from "@/utils/dates";
import { TransactionsSection } from "@/components/assets/transactions-section";
import { AnalystRatingSection } from "@/components/assets/analyst-section";
import { useSession } from "@/utils/auth-context";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";

// Period options for chart
const PERIOD_OPTIONS: PeriodOption[] = [
	{ id: "1D", label: "1 D" },
	{ id: "5D", label: "5 D" },
	{ id: "1M", label: "1 M" },
	{ id: "6M", label: "6 M" },
	{ id: "1Y", label: "1 Y" },
	{ id: "5Y", label: "5 Y" },
];

// Period options for precious metals (excluding 1D since it rarely has data)
const PERIOD_OPTIONS_PRECIOUS_METALS: PeriodOption[] = [
	{ id: "5D", label: "5 D" },
	{ id: "1M", label: "1 M" },
	{ id: "6M", label: "6 M" },
	{ id: "1Y", label: "1 Y" },
	{ id: "5Y", label: "5 Y" },
];

/** Get the ticker/symbol to fetch price history for */
function getAssetSymbol(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return asset.ticker;
		case "crypto":
			return asset.symbol;
		case "precious_metals":
			// Map metal types to common tickers
			switch (asset.metalType) {
				case "gold":
					return "GC=F";
				case "silver":
					return "SI=F";
				case "platinum":
					return "PL=F";
				case "palladium":
					return "PA=F";
				default:
					return "";
			}
		default:
			return "";
	}
}

/** Convert API price history to chart data points.
 *  Uses evenly-spaced x values (index-based) instead of real timestamps
 *  so overnight / weekend gaps don't create visual plateaus.           */
function toChartData(
	data: PriceHistoryPoint[],
): { x: number; y: number; extraData?: any }[] {
	return data.map((point, index) => {
		const date = new Date(point.date);
		return {
			x: index,
			y: point.close,
			extraData: {
				formattedTime: formatDateTime(date)
			},
		};
	});
}

export default function AssetDetailScreen() {
	const { user } = useSession();
	const { triggerHaptics } = useHaptics();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [asset, setAsset] = useState<Asset | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPeriod, setSelectedPeriod] = useState("1D");
	const [formattedValue, setFormattedValue] = useState("");

	// Modal states
	const [transactionModalVisible, setTransactionModalVisible] = useState(false);
	const [transactionType, setTransactionType] = useState<TransactionType>("buy");
	const [isRecording, setIsRecording] = useState(false);

	useFocusEffect(
		useCallback(() => {
			loadAsset();
		}, [id, user?.currency])
	);

	// Convert asset value to user's currency
	useEffect(() => {
		if (!asset) return;
		const value = getAssetValue(asset);
		if (value) {
			transformNumberToUserCurrency(value, asset.currency).then(setFormattedValue);
		}
	}, [asset, user?.currency]);

	const loadAsset = async () => {
		setIsLoading(true);
		try {
			const assets = await getAssets();
			const foundAsset = assets.find((a) => a.id === id);
			setAsset(foundAsset || null);
			// Set initial period based on asset type
			if (foundAsset?.type === "precious_metals") {
				setSelectedPeriod("5D");
			} else {
				setSelectedPeriod("1D");
			}
		} catch (error) {
			console.error("Error loading asset:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// ── Chart logic ──────────────────────────────────────────────────────

	const hasLiveChart = asset ? supportsLiveChart(asset.type) : false;
	const symbol = asset ? getAssetSymbol(asset) : "";
	const shouldFetchPrices = hasLiveChart && symbol.length > 0;
	const shouldFetchAnalyst = asset?.type === 'stocks_etfs' && asset.tickerType === 'Stock'

	// Fetch all periods in parallel when screen loads
	const priceHistory1D = usePriceHistory(symbol, "1D", shouldFetchPrices);
	const priceHistory5D = usePriceHistory(symbol, "5D", shouldFetchPrices);
	const priceHistory1M = usePriceHistory(symbol, "1M", shouldFetchPrices);
	const priceHistory6M = usePriceHistory(symbol, "6M", shouldFetchPrices);
	const priceHistory1Y = usePriceHistory(symbol, "1Y", shouldFetchPrices);
	const priceHistory5Y = usePriceHistory(symbol, "5Y", shouldFetchPrices);
	const analystRating = useAnalystRating(symbol, shouldFetchAnalyst);

	// Real-time current price for the chart header
	const currentPriceQuery = useCurrentPrice(symbol, shouldFetchPrices);
	const [liveFormattedValue, setLiveFormattedValue] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (!currentPriceQuery.data || !asset) return;
		const liveTotalValue = currentPriceQuery.data.current_price * getNetQuantity(asset);
		transformNumberToUserCurrency(liveTotalValue, currentPriceQuery.data.currency)
			.then(setLiveFormattedValue);
	}, [currentPriceQuery.data, asset]);

	// Map period IDs to their data
	const priceDataByPeriod = useMemo(() => ({
		"1D": priceHistory1D,
		"5D": priceHistory5D,
		"1M": priceHistory1M,
		"6M": priceHistory6M,
		"1Y": priceHistory1Y,
		"5Y": priceHistory5Y,
	}), [priceHistory1D, priceHistory5D, priceHistory1M, priceHistory6M, priceHistory1Y, priceHistory5Y]);

	// Get the data for the currently selected period
	const currentPeriodData = priceDataByPeriod[selectedPeriod as keyof typeof priceDataByPeriod];
	const isChartLoading = currentPeriodData?.isLoading ?? false;

	// Build chart data from API response for selected period
	const chartData = useMemo(() => {
		if (hasLiveChart && currentPeriodData?.data?.data) {
			return toChartData(currentPeriodData.data.data);
		}
		return [];
	}, [hasLiveChart, currentPeriodData?.data, selectedPeriod]);

	// Use the currency reported by the API (the market's native currency),
	const chartCurrency = currentPeriodData?.data?.currency ?? asset?.currency ?? "USD";

	// ── Actions ──────────────────────────────────────────────────────────

	const handleOpenBuyModal = useCallback(() => {
		triggerHaptics("Soft");
		if (!asset) return;
		setTransactionType("buy");
		setTransactionModalVisible(true);
	}, [asset]);

	const handleOpenSellModal = useCallback(() => {
		triggerHaptics("Soft");
		if (!asset) return;
		setTransactionType("sell");
		setTransactionModalVisible(true);
	}, [asset]);

	const handleConfirmTransaction = useCallback(
		async (transaction: Transaction) => {
			if (!asset) return;
			setIsRecording(true);
			try {
				await addTransactionToAsset(asset.id, transaction);
				triggerHaptics("Success");
				setTransactionModalVisible(false);
				// Reload asset to reflect new transaction
				await loadAsset();
			} catch (error) {
				triggerHaptics("Error");
				console.error("Error recording transaction:", error);
			} finally {
				setIsRecording(false);
			}
		},
		[asset],
	);

	const handlePeriodChange = useCallback(
		(period: string) => {
			triggerHaptics("Light");
			setSelectedPeriod(period);
		},
		[],
	);

	// ── Loading / Not Found states ───────────────────────────────────────

	if (isLoading) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator size="large" color={Colors.foreground} />
			</View>
		);
	}

	if (!asset) {
		return (
			<View className="flex-1 bg-background items-center justify-center px-10">
				<Text className="text-foreground text-lg font-lausanne-medium text-center mb-2">
					Asset not found
				</Text>
				<Pressable onPress={() => router.back()} className="mt-4">
					<Text className="text-accent text-base font-lausanne-regular">Go back</Text>
				</Pressable>
			</View>
		);
	}

	const value = getAssetValue(asset);

	// Use different period options for precious metals (1D doesn't work)
	const periodOptions = asset.type === "precious_metals"
		? PERIOD_OPTIONS_PRECIOUS_METALS
		: PERIOD_OPTIONS;

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="light" />

			<View className="pt-safe-offset-5 bg-foreground px-5 gap-6 flex-row items-center justify-between pb-3">
				{/* Back button */}
				<View className="flex-row items-center flex-1 justify-start gap-3 mt-1">
					<Pressable
						onPress={() => router.back()}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						className="p-1 -ml-1 z-10"
					>
						<Icon name="arrow-left-line" size="24" color={Colors.background} fallback={null} />
					</Pressable>

					<Text
						className="text-background text-xl font-lausanne-medium"
						numberOfLines={1}
					>
						{asset.name}
					</Text>
				</View>

				{/* Edit button */}
				<Pressable
					onPress={() => router.push({ pathname: "/add-asset", params: { id: asset.id } })}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					className="h-10 px-4 flex-row gap-2 items-center z-10 bg-[#202020]"
				>
					<Text className="text-background text-sm font-lausanne-regular">Edit</Text>
					<Icon name="edit-line" size="16" color={Colors.background} fallback={null} />
				</Pressable>
			</View>

			{/* Scrollable content */}
			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-16 flex-grow">
				{/* Chart Section — only for asset types with live price data */}
				{hasLiveChart ? (
					<View className="mt-4 mb-6">
						<AssetPriceChart
							data={chartData}
							isLoading={isChartLoading}
							chartCurrency={chartCurrency}
							currentValue={value}
							formattedValue={formattedValue}
							selectedPeriod={selectedPeriod}
							liveFormattedValue={liveFormattedValue}
						/>
						<PeriodSelector
							options={periodOptions}
							selected={selectedPeriod}
							onSelect={handlePeriodChange}
						/>
					</View>
				) : (
					/* Simple value display for asset types without chart */
					<View className="mt-4 mb-6">
						<Text className="text-foreground text-3xl font-lausanne-bold leading-tight">
							{formattedValue}
						</Text>
					</View>
				)}

				{/* Sections */}
				<DetailsSection asset={asset} />
				<InformationSection asset={asset} />
				{analystRating.data && <AnalystRatingSection analystRating={analystRating.data} />}
				<TransactionsSection
					asset={asset}
					onAddTransaction={handleOpenBuyModal}
				/>
				<AssetActions
					asset={asset}
					onBuyTransaction={handleOpenBuyModal}
					onSellTransaction={handleOpenSellModal}
				/>
			</ScrollView>

			{/* Transaction Modal */}
			<TransactionModal
				visible={transactionModalVisible}
				asset={asset}
				initialType={transactionType}
				onClose={() => setTransactionModalVisible(false)}
				onConfirm={handleConfirmTransaction}
				isProcessing={isRecording}
			/>
		</View>
	);
}
