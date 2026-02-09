import { Colors } from "@/constants/colors";
import { formatNumber } from "@/utils/numbers";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Icon from "react-native-remix-icon";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useHaptics } from "@/hooks/haptics";
// @ts-ignore
import LineChart from "react-native-simple-line-chart";

type ChartPoint = { x: number; y: number; extraData?: any };

type Props = {
	data: ChartPoint[];
	isLoading: boolean;
	chartCurrency: string;
	/** Current display value (from asset) - shown when no point is selected */
	currentValue: number;
	formattedValue: string;
	/** Currently selected period id (e.g. "1D", "1M") */
	selectedPeriod: string;
	/** Real-time formatted value from useCurrentPrice — triggers an animated transition when it arrives */
	liveFormattedValue?: string;
};

/** Human-readable labels for each period */
const PERIOD_LABELS: Record<string, string> = {
	"1D": "Today",
	"5D": "Last 5 days",
	"1M": "Last month",
	"6M": "Last 6 months",
	"1Y": "Last year",
	"5Y": "Last 5 years",
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 180;
/** The library uses 10 px padding top & bottom inside the SVG */
const SVG_Y_PAD = 10;

/** Throttle intervals — keep JS thread free during pan gestures */
const STATE_THROTTLE_MS = 50;  // max ~20 React state updates / sec
const HAPTICS_THROTTLE_MS = 80; // max ~12 haptic pulses / sec

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
		<GestureHandlerRootView style={{ height }}>
			<LineChart
				lines={lines}
				width={width}
				height={height}
				activePointSharedValue={activePointSharedValue}
				activeLineIndex={1}
			/>
		</GestureHandlerRootView>
	),
);

export function AssetPriceChart({ data, isLoading, chartCurrency, currentValue, formattedValue, selectedPeriod, liveFormattedValue }: Props) {
	const { triggerHaptics } = useHaptics();
	const pointSelected = useSharedValue<any>(null);
	const [selectedPoint, setSelectedPoint] = useState<any>(null);

	// Throttle refs — survive re-renders without causing them
	const lastStateTs = useRef(0);
	const lastHapticsTs = useRef(0);

	// ── Animated slide transition: stored value → live price ─────────────
	const SLIDE_DISTANCE = 38; // ≈ text-3xl leading-tight height
	const slideProgress = useSharedValue(0); // 0 → 1 drives the slide
	const [resolvedBaseValue, setResolvedBaseValue] = useState(formattedValue);
	const [slideTarget, setSlideTarget] = useState<string | null>(null);
	const hasAnimatedToLive = useRef(false);

	// Keep base value in sync with formattedValue until live price arrives
	useEffect(() => {
		if (!hasAnimatedToLive.current) {
			setResolvedBaseValue(formattedValue);
		}
	}, [formattedValue]);

	// Called on UI thread completion → commit the new value on JS thread
	const commitSlide = useCallback((value: string) => {
		setResolvedBaseValue(value);
		setSlideTarget(null);
	}, []);

	// 1) When liveFormattedValue arrives, set the target (render both views)
	useEffect(() => {
		if (liveFormattedValue && !hasAnimatedToLive.current) {
			hasAnimatedToLive.current = true;
			slideProgress.value = 0;
			setSlideTarget(liveFormattedValue);
		}
	}, [liveFormattedValue]);

	// 2) Once the target is rendered, kick off the slide animation
	useEffect(() => {
		if (slideTarget) {
			slideProgress.value = withTiming(1, { duration: 450 }, (finished) => {
				"worklet";
				if (finished) {
					runOnJS(commitSlide)(slideTarget);
				}
			});
		}
	}, [slideTarget, commitSlide]);

	// Old value: slides UP and fades out
	const outgoingStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -slideProgress.value * SLIDE_DISTANCE }],
		opacity: 1 - slideProgress.value,
	}));

	// New value: slides UP from below and fades in
	const incomingStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: (1 - slideProgress.value) * SLIDE_DISTANCE }],
		opacity: slideProgress.value,
		position: "absolute" as const,
		left: 0,
	}));

	/**
	 * Called from the UI thread via runOnJS on every active-point change.
	 * Throttles React state updates and haptics so the JS thread stays
	 * close to 60 fps instead of getting flooded.
	 */
	const handlePointChange = useCallback(
		(point: any) => {
			// Finger lifted → always update immediately (library sends `undefined`, not `null`)
			if (point == null) {
				setSelectedPoint(null);
				lastStateTs.current = 0;
				return;
			}

			const now = Date.now();

			// Skip this frame if we updated state too recently
			if (now - lastStateTs.current < STATE_THROTTLE_MS) return;
			lastStateTs.current = now;

			setSelectedPoint(point);

			// Fire haptics at an even lower cadence, but only if we've already
			// triggered haptics before (prevents initial load haptic)
			if (lastHapticsTs.current > 0 && now - lastHapticsTs.current >= HAPTICS_THROTTLE_MS) {
				lastHapticsTs.current = now;
				triggerHaptics("Soft");
			} else if (lastHapticsTs.current === 0) {
				// First interaction: just record the timestamp without triggering
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
			return { displayValue: resolvedBaseValue || formatNumber(currentValue, chartCurrency), displayChange: 0, displayPriceChange: 0, isPositive: true, hasChange: false };
		}

		const firstValue = data[0].y;
		const lastValue = data[data.length - 1].y;
		const baseChange = ((lastValue - firstValue) / firstValue) * 100;
		const basePriceChange = lastValue - firstValue;
		const basePositive = baseChange >= 0;

		if (selectedPoint) {
			const selectedChange = ((selectedPoint.y - firstValue) / firstValue) * 100;
			const selectedPriceChange = selectedPoint.y - firstValue;
			return {
				displayValue: formatNumber(selectedPoint.y, chartCurrency),
				displayChange: selectedChange,
				displayPriceChange: selectedPriceChange,
				isPositive: selectedChange >= 0,
				hasChange: true,
			};
		}

		return {
			displayValue: resolvedBaseValue,
			displayChange: baseChange,
			displayPriceChange: basePriceChange,
			isPositive: basePositive,
			hasChange: true,
		};
	}, [data, selectedPoint, currentValue, resolvedBaseValue, chartCurrency]);

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
			}

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
				<View style={{ height: SLIDE_DISTANCE, overflow: "hidden", justifyContent: "center" }}>
					{slideTarget != null ? (
						<>
							<Animated.View style={outgoingStyle}>
								<Text className="text-foreground text-3xl font-lausanne-bold leading-tight">
									{displayValue}
								</Text>
							</Animated.View>
							<Animated.View style={incomingStyle}>
								<Text className="text-foreground text-3xl font-lausanne-bold leading-tight">
									{slideTarget}
								</Text>
							</Animated.View>
						</>
					) : (
						<Text className="text-foreground text-3xl font-lausanne-bold leading-tight">
							{displayValue}
						</Text>
					)}
				</View>
				{/* Always reserve space for the change row */}
				<View className="h-6 flex-row items-center">
					{hasChange && (
						<View className="flex-row items-center gap-2">
							<Text className={`text-sm font-lausanne-medium ${pillText}`}>
								{changeSign}{formatNumber(Math.abs(displayPriceChange), chartCurrency)}
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
