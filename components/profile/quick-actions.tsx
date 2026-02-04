import { Colors } from "@/constants/colors";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Icon, { IconName } from "react-native-remix-icon";

const QUICK_ACTIONS: { id: string; title: string; description: string; icon: IconName, onPress: () => void }[] = [
	{
		id: "add-asset",
		title: "Add new asset",
		description: "Stocks, bonds, real estate...",
		icon: "add-circle-line",
		onPress: () => {
			router.push("/(tabs)/assets");
		}
	},
	{
		id: "export",
		title: "Export portfolio",
		description: "Download as CSV",
		icon: "file-excel-2-line",
		onPress: () => {
			//TODO: Implement export to csv
			console.log('export to csv')
		}
	},
];

export function QuickActions() {
	return (
		<View className="px-5 mb-4">
			<Text className="text-foreground text-lg font-lausanne-medium -mb-1">Quick Actions</Text>
			{QUICK_ACTIONS.map((action, index) => (
				<Pressable
					key={action.id}
					onPress={action.onPress}
					className={`flex-row items-center justify-between py-4 ${index < QUICK_ACTIONS.length - 1 ? "border-b border-border" : ""}`}>
					<View className="flex-row items-center justify-between gap-2 flex-1">
						<View className="flex-row flex-grow items-center gap-3 flex-1">
							<View className="aspect-square flex items-center justify-center w-12 bg-secondary">
								<Icon name={action.icon} size="20" color={Colors.foreground} fallback={null} />
							</View>
							<View className="flex-1">
								<View className="flex-row items-center gap-2">
									<Text className="font-lausanne-regular text-foreground text-base">
										{action.title}
									</Text>
								</View>
								<Text className="font-lausanne-light text-muted-foreground text-sm">
									{action.description}
								</Text>
							</View>
						</View>
						<Icon name="arrow-right-s-line" size="20" color={Colors.foreground} fallback={null} />
					</View>
				</Pressable>
			))}
		</View>
	);
}