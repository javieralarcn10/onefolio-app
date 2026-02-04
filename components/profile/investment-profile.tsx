import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { User } from "@/types/custom";
import Icon from "react-native-remix-icon";
import { Colors } from "@/constants/colors";

export function InvestmentProfile({ user }: { user: User }) {
	const goals = user.investmentGoals ? user.investmentGoals.split(",") : [];
	const firstGoal = goals[0]?.trim();
	const remainingCount = goals.length - 1;

	return (
		<View className="px-5 mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Investment Profile</Text>
			{/* Risk Profile - Featured */}
			<Pressable
				onPress={() => router.push("/risk-profile-settings")}
				className="border border-border p-4 mb-2 flex-row items-center justify-between"
			>
				<View className="flex-1">
					<Text className="text-muted-foreground text-xs font-lausanne-medium uppercase tracking-wide mb-0.5">
						Risk Profile
					</Text>
					<Text className="text-foreground text-base font-lausanne-regular">
						{user.investorProfile || "Not set"}
					</Text>
				</View>
				<Icon name="arrow-right-s-line" size="20" color={Colors.mutedForeground} fallback={null} />
			</Pressable>

			{/* Financial Plan - Secondary */}
			<Pressable
				onPress={() => router.push("/financial-plan-settings")}
				className="border border-border p-4 flex-row items-center justify-between"
			>
				<View className="flex-1">
					<Text className="text-muted-foreground text-xs font-lausanne-medium uppercase tracking-wide mb-0.5">
						Financial Plan
					</Text>
					<Text className="text-foreground text-base font-lausanne-regular">
						{firstGoal}{remainingCount > 0 && <Text className="text-muted-foreground"> +{remainingCount}</Text>}
					</Text>
				</View>
				<Icon name="arrow-right-s-line" size="20" color={Colors.mutedForeground} fallback={null} />
			</Pressable>
		</View>
	);
}