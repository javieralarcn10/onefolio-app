import { Asset } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { generateMockPriceHistory } from "./asset-detail-helpers";

function SimpleChart({ data }: { data: { date: string; value: number }[] }) {
	if (data.length === 0) return null;

	const maxValue = Math.max(...data.map((d) => d.value));
	const minValue = Math.min(...data.map((d) => d.value));
	const range = maxValue - minValue || 1;

	const chartHeight = 120;

	const firstValue = data[0]?.value || 0;
	const lastValue = data[data.length - 1]?.value || 0;
	const isPositive = lastValue >= firstValue;
	const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

	return (
		<View className="mt-4">
			<View className="flex-row items-center justify-between mb-3">
				<Text className="text-muted-foreground text-sm font-lausanne-regular">12 Month Performance</Text>
				<View className="flex-row items-center gap-1">
					<Icon
						name={isPositive ? "arrow-up-line" : "arrow-down-line"}
						size="14"
						color={isPositive ? "#10b981" : "#ef4444"}
						fallback={null}
					/>
					<Text className={`text-sm font-lausanne-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
						{changePercent >= 0 ? "+" : ""}{formatNumber(changePercent)}%
					</Text>
				</View>
			</View>
			<View className="flex-row items-end h-[120px] gap-0.5">
				{data.map((point, index) => {
					const height = ((point.value - minValue) / range) * chartHeight;
					return (
						<View
							key={index}
							className="flex-1"
							style={{
								height: Math.max(4, height),
								backgroundColor: isPositive ? "#10b981" : "#ef4444",
								opacity: 0.7 + (index / data.length) * 0.3,
							}}
						/>
					);
				})}
			</View>
			<View className="flex-row justify-between mt-2">
				<Text className="text-muted-foreground text-xs font-lausanne-light">
					{new Date(data[0]?.date).toLocaleDateString("en", { month: "short", year: "2-digit" })}
				</Text>
				<Text className="text-muted-foreground text-xs font-lausanne-light">
					{new Date(data[data.length - 1]?.date).toLocaleDateString("en", { month: "short", year: "2-digit" })}
				</Text>
			</View>
		</View>
	);
}

export function PerformanceSection({ asset }: { asset: Asset }) {
	const priceHistory = generateMockPriceHistory(asset);

	return (
		<View className="mb-6">
			<Text className="text-foreground text-base font-lausanne-medium mb-3">Performance</Text>
			<View className="bg-input p-4 border border-border">
				<SimpleChart data={priceHistory} />
			</View>
		</View>
	);
}
