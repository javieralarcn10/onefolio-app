import { Colors } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import Icon from "react-native-remix-icon";

export function EmptyState({ isPremium }: { isPremium: boolean }) {
	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			<View className="pt-safe">
				<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
					<View>
						<Text className="text-foreground text-2xl font-lausanne-medium">Analysis</Text>
						<Text className="text-muted-foreground text-sm font-lausanne-light">
							Portfolio risk and diversification
						</Text>
					</View>
					{!isPremium && (
						<View className="bg-accent px-3 py-1.5 flex-row items-center gap-2">
							<Icon name="vip-crown-line" size="18" color={Colors.foreground} fallback={null} />
							<Text className="text-foreground text-xs font-lausanne-medium">Free Plan</Text>
						</View>
					)}
				</View>
			</View>

			<View className="flex-1 items-center justify-center px-10">
				<View className="bg-secondary w-16 aspect-square items-center justify-center mb-4">
					<Icon name="scan-2-line" size="26" color={Colors.foreground} fallback={null} />
				</View>
				<Text className="text-foreground text-lg font-lausanne-medium text-center mb-2">
					No data to analyze
				</Text>
				<Text className="text-muted-foreground text-base font-lausanne-light text-center">
					Add some assets first to see your risk analysis and geopolitical exposure.
				</Text>
			</View>
		</View>
	);
}