import { AnalystRatingResponse } from "@/utils/api/finance";
import { Text, View } from "react-native";

interface RatingBarProps {
	label: string;
	percentage: number;
	color: string;
}

function RatingBar({ label, percentage, color }: RatingBarProps) {
	return (
		<View className="flex-row items-center justify-between gap-2 py-2">
			<View className="w-1/2 h-2.5 bg-muted-foreground/10">
				<View className="h-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
			</View>
			<Text className="text-foreground text-sm font-lausanne-medium">
				{label} · {percentage}%
			</Text>
		</View>
	);
}

const RATING_COLORS = {
	strong_buy: "#15803d",
	buy: "#22c55e",
	hold: "#eab308",
	sell: "#f97316",
	strong_sell: "#ef4444",
} as const;

const RATING_LABELS = {
	strong_buy: "Strong Buy",
	buy: "Buy",
	hold: "Hold",
	sell: "Sell",
	strong_sell: "Strong Sell",
} as const;

export function AnalystRatingSection({ analystRating }: { analystRating: AnalystRatingResponse }) {
	if (!analystRating?.recommendation_trends?.length) return null;

	const recommendationTrends = analystRating.recommendation_trends.find(
		(trend) => trend.period === "current_month"
	);

	if (!recommendationTrends) return null;

	const totalAnalysts = recommendationTrends.total_analysts;

	const ratings = [
		{ key: "strong_buy", count: recommendationTrends.strong_buy },
		{ key: "buy", count: recommendationTrends.buy },
		{ key: "hold", count: recommendationTrends.hold },
		{ key: "sell", count: recommendationTrends.sell },
		{ key: "strong_sell", count: recommendationTrends.strong_sell },
	] as const;

	return (
		<View className="mb-6">
			<Text className="text-foreground text-base font-lausanne-medium mb-2">
				Recommendation Trends
			</Text>
			<View className="bg-input border border-border px-4">
				{ratings.map(({ key, count }) => {
					const percentage = Math.round((count / totalAnalysts) * 100);
					return (
						<RatingBar
							key={key}
							label={RATING_LABELS[key]}
							percentage={percentage}
							color={RATING_COLORS[key]}
						/>
					);
				})}
			</View>
		</View>
	);
}