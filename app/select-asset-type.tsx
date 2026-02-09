import { ASSETS_OPTIONS } from "@/components/assets/asset-config";
import { Colors } from "@/constants/colors";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";

export default function SelectAssetTypeScreen() {
	const handleSelectType = (optionId: number) => {
		router.replace({
			pathname: "/add-asset",
			params: { type: optionId.toString() },
		});
	};

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="pt-safe">
				<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
					<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
						<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
					</Pressable>
					<Text className="text-foreground text-2xl font-lausanne-regular leading-none">Add Asset</Text>
					<View className="w-[15%]" />
				</View>
			</View>

			{/* Asset Types List */}
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName="px-5 pb-safe-offset-10"
			>
				<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal mb-4">
					Select the type of asset you want to add to your portfolio.
				</Text>

				<View className="gap-2">
					{ASSETS_OPTIONS.map((option) => (
						<Pressable
							key={option.id}
							onPress={() => handleSelectType(option.id)}
							className="flex-row items-center justify-between p-3 border border-foreground"
						>
							<View className="flex-row items-center gap-3 flex-1">
								<View
									className="w-12 h-12 items-center justify-center"
									style={{ backgroundColor: option.bgIcon }}
								>
									<Icon name={option.icon} size="20" color={option.colorIcon} fallback={null} />
								</View>
								<View className="flex-1">
									<Text className="font-lausanne-regular text-foreground text-base">
										{option.title}
									</Text>
									<Text className="font-lausanne-light text-muted-foreground text-sm">
										{option.description}
									</Text>
								</View>
							</View>
							<Icon name="arrow-right-s-line" size="22" color={Colors.mutedForeground} fallback={null} />
						</Pressable>
					))}
				</View>
			</ScrollView>
		</View>
	);
}
