import { Colors } from "@/constants/colors";
import { useHaptics } from "@/hooks/haptics";
import { QuickAction } from "@/types/custom";
import { showPaywall } from "@/utils/revenue-cat";
import { useSubscription } from "@/utils/subscription-context";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";

export function QuickActions() {
	const { isPremium } = useSubscription();
	const { triggerHaptics } = useHaptics();

	const handleAddAsset = useCallback(() => {
		router.push("/select-asset-type");
	}, []);

	const handleExport = useCallback(() => {
		if (!isPremium) {
			triggerHaptics("Error");
			Alert.alert("Premium Feature",
				"Export your portfolio as CSV. Upgrade to Premium to unlock this feature.",
				[
					{ text: "Cancel", style: "destructive" },
					{ text: "Upgrade", style: "default", onPress: () => showPaywall() }
				]);
			return;
		}
		//TODO: Implement export to csv
		console.log('export to csv')
	}, [isPremium, triggerHaptics]);

	const quickActions: QuickAction[] = useMemo(() => [
		{
			id: "add-asset",
			title: "Add new asset",
			description: "Stocks, bonds, real estate...",
			icon: "add-circle-line",
			disabled: false,
			onPress: handleAddAsset,
		},
		{
			id: "export",
			title: "Export portfolio",
			description: "Download as CSV",
			icon: "file-excel-2-line",
			disabled: !isPremium,
			onPress: handleExport,
		},
	], [handleAddAsset, handleExport]);

	return (
		<View className="px-5 mb-4">
			<Text className="text-foreground text-lg font-lausanne-medium -mb-1">Quick Actions</Text>
			{quickActions.map((action, index) => (
				<Pressable
					key={action.id}
					onPress={action.onPress}
					className={`flex-row items-center justify-between py-4 ${index < quickActions.length - 1 ? "border-b border-border" : ""}`}>
					<View className="flex-row items-center justify-between gap-2 flex-1">
						<View className="flex-row flex-grow items-center gap-3 flex-1">
							<View className="aspect-square flex items-center justify-center w-12 bg-secondary">
								<Icon name={action.icon} size="20" color={Colors.foreground} fallback={null} />
							</View>
							<View className="flex-1">
								<View className="flex-row items-center gap-1">
									<Text className="font-lausanne-regular text-foreground text-base">
										{action.title}
									</Text>
									{action.disabled && <Text className="text-foreground text-xs font-lausanne-regular bg-accent px-1.5 py-0.5">Premium</Text>}
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