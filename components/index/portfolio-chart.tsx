import { Colors } from "@/constants/colors";
import { formatNumber } from "@/utils/numbers";
import { useHaptics } from "@/hooks/haptics";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
// @ts-ignore
import LineChart from "react-native-simple-line-chart";

type ChartPoint = { x: number; y: number; extraData?: any };

type Props = {
	data: ChartPoint[];
	isLoading: boolean;
	currency: string;
	currentValue: number;
	formattedValue: string;
	selectedPeriod: string;
};

/** Human-readable labels for each period */
const PERIOD_LABELS: Record<string, string> = {
	"1W": "Last week",
	"1M": "Last month",
	"3M": "Last 3 months",
	"YTD": "Year to date",
	"1Y": "Last year",
	"ALL": "All time",
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 180;
const SVG_Y_PAD = 10;

/** Throttle intervals — keep JS thread free during pan gestures */
const STATE_THROTTLE_MS = 50;
const HAPTICS_THROTTLE_MS = 80;

/**
 * Memoised chart SVG — only re-renders when `lines` or dimensions change,
 * NOT when the header text (price / change) updates during a pan gesture.
 */
const MemoizedChart = React.memo(
	({ lines, width, height, activePointSharedValue }: {
		lines: any[];
		width: number;
		height: number;
		activePointSharedValue: any;
	}) => (
		<View style={{ height }}>
			<LineChart
				lines={lines}
				width={width}
				height={height}
				activePointSharedValue={activePointSharedValue}
				activeLineIndex={1}
			/>
		</View>
	),
);

export function PortfolioChart({
	data,
	isLoading,
	currency,
	currentValue,
	formattedValue,
	selectedPeriod,
}: Props) {
	const { triggerHaptics } = useHaptics();
	const pointSelected = useSharedValue<any>(null);
	const [selectedPoint, setSelectedPoint] = useState<any>(null);

	// Throttle refs — survive re-renders without causing them
	const lastStateTs = useRef(0);
	const lastHapticsTs = useRef(0);

	/**
	 * Called from the UI thread via runOnJS on every active-point change.
	 * Throttles React state updates and haptics so the JS thread stays
	 * close to 60 fps instead of getting flooded.
	 */
	const handlePointChange = useCallback(
		(point: any) => {
			if (point == null) {
				setSelectedPoint(null);
				lastStateTs.current = 0;
				return;
			}

			const now = Date.now();
			if (now - lastStateTs.current < STATE_THROTTLE_MS) return;
			lastStateTs.current = now;

			setSelectedPoint(point);

			if (lastHapticsTs.current > 0 && now - lastHapticsTs.current >= HAPTICS_THROTTLE_MS) {
				lastHapticsTs.current = now;
				triggerHaptics("Soft");
			} else if (lastHapticsTs.current === 0) {
				lastHapticsTs.current = now;
			}
		},
		[triggerHaptics],
	);

	useAnimatedReaction(
		() => pointSelected.value,
		(newValue, prevValue) => {
			if (newValue !== prevValue) {
				runOnJS(handlePointChange)(newValue);
			}
		},
	);

	// Price statistics
	const { minPrice, maxPrice, firstPrice } = useMemo(() => {
		if (data.length === 0) return { minPrice: 0, maxPrice: 0, firstPrice: 0 };
		const prices = data.map((d) => d.y);
		return {
			minPrice: Math.min(...prices),
			maxPrice: Math.max(...prices),
			firstPrice: data[0].y,
		};
	}, [data]);

	// Calculate change (both absolute and percentage)
	const { displayValue, displayChange, displayPriceChange, isPositive, hasChange } = useMemo(() => {
		if (data.length < 2) {
			return {
				displayValue: (formattedValue || formatNumber(currentValue, currency)),
				displayChange: 0,
				displayPriceChange: 0,
				isPositive: true,
				hasChange: false,
			};
		}

		const firstValue = data[0].y;
		const lastValue = data[data.length - 1].y;
		const baseChange = ((lastValue - firstValue) / firstValue) * 100;
		const basePriceChange = lastValue - firstValue;
		const basePositive = baseChange >= 0;

		if (selectedPoint) {
			const selectedChange = ((selectedPoint.y - firstValue) / firstValue) * 100;
			const selectedPriceChange = selectedPoint.y - firstValue;
			const selPositive = selectedChange >= 0;
			return {
				displayValue: formatNumber(selectedPoint.y, currency),
				displayChange: selectedChange,
				displayPriceChange: selectedPriceChange,
				isPositive: selPositive,
				hasChange: true,
			};
		}

		return {
			displayValue: formattedValue,
			displayChange: baseChange,
			displayPriceChange: basePriceChange,
			isPositive: basePositive,
			hasChange: true,
		};
	}, [data, selectedPoint, currentValue, formattedValue, currency]);

	const chartColor = Colors.foreground;

	const chartLines = useMemo(() => {
		if (data.length === 0) return [];

		// 1) Baseline dashed line at the first data-point's price
		const baselineLine = {
			data: [
				{ x: data[0].x, y: firstPrice, disableActivePoint: true },
				{ x: data[data.length - 1].x, y: firstPrice, disableActivePoint: true },
			],
			lineColor: Colors.border,
			curve: "linear" as const,
			lineWidth: 1,
			strokeDasharray: "1,4",
		};

		// 2) Main price line (rendered on top of the baseline)
		const mainLine = {
			data,
			lineColor: chartColor,
			curve: "monotone" as const,
			activePointConfig: {
				color: Colors.mutedForeground,
				radius: 3,
				borderColor: Colors.mutedForeground,
				showVerticalLine: true,
				verticalLineColor: Colors.border,
			},
			lineWidth: 1.6,
			inActivePointConfig: {
				color: "transparent",
			},
		};

		return [baselineLine, mainLine];
	}, [data, chartColor, firstPrice]);

	const periodLabel = PERIOD_LABELS[selectedPeriod] || selectedPeriod;
	const changeSign = isPositive ? "+" : "-";
	const arrowColor = isPositive ? "#15803d" : "#b91c1c";
	const pillBg = isPositive ? "bg-green-100" : "bg-red-100";
	const pillText = isPositive ? "text-green-800" : "text-red-800";

	return (
		<View>
			{/* Value and Change — fixed height to prevent layout jumps */}
			<View className="mb-2">
				<Text className="text-foreground text-3xl font-lausanne-bold leading-tight">
					{displayValue}
				</Text>
				{/* Always reserve space for the change row */}
				<View className="h-6 flex-row items-center">
					{hasChange && (
						<View className="flex-row items-center gap-2">
							<Text className={`text-sm font-lausanne-medium ${pillText}`}>
								{changeSign}{formatNumber(Math.abs(displayPriceChange), currency)}
							</Text>
							<View className={`flex-row items-center gap-1 ${pillBg} px-2 py-0.5`}>
								<Icon
									name={isPositive ? "arrow-up-fill" : "arrow-down-fill"}
									size="12"
									color={arrowColor}
									fallback={null}
								/>
								<Text className={`text-xs font-lausanne-medium ${pillText}`}>
									{changeSign}{Math.abs(displayChange).toFixed(2)}%
								</Text>
							</View>
							<Text className="text-muted-foreground text-sm font-lausanne-light">
								{selectedPoint ? (selectedPoint.extraData?.formattedTime ?? "") : periodLabel}
							</Text>
						</View>
					)}
				</View>
			</View>

			{/* Chart */}
			{isLoading ? (
				<View className="h-[183px] items-center justify-center bg-input border border-border">
					<ActivityIndicator size="small" color={Colors.foreground} />
				</View>
			) : data.length > 0 ? (
				<View className="bg-input border border-border overflow-hidden">
					<MemoizedChart
						lines={chartLines}
						width={SCREEN_WIDTH - 19}
						height={CHART_HEIGHT}
						activePointSharedValue={pointSelected}
					/>

					{/* Min / Max price labels — right edge */}
					{minPrice !== maxPrice && (
						<>
							<View
								style={{
									position: "absolute",
									right: 2,
									top: SVG_Y_PAD - 6,
								}}
								pointerEvents="none"
							>
								<Text className="text-foreground text-xs font-lausanne-medium z-10 bg-accent/90 px-1">
									{formatNumber(maxPrice)}
								</Text>
							</View>
							<View
								style={{
									position: "absolute",
									right: 2,
									bottom: SVG_Y_PAD - 6,
								}}
								pointerEvents="none"
							>
								<Text className="text-foreground text-xs font-lausanne-medium z-10 bg-accent/90 px-1">
									{formatNumber(minPrice)}
								</Text>
							</View>
						</>
					)}
				</View>
			) : (
				<View className="h-[183px] items-center justify-center">
					<Text className="text-muted-foreground text-sm font-lausanne-light">
						No data available for this period
					</Text>
				</View>
			)}
		</View>
	);
}
