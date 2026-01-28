import { Colors } from "@/constants/colors";
import { AssetOption as AssetOptionType } from "@/types/custom";
import { router } from "expo-router";
import { PlusIcon } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";

type AssetOptionProps = {
	asset: AssetOptionType;
	count?: number;
};

export function AssetOption({ asset, count = 0 }: AssetOptionProps) {
	const hasAssets = count > 0;

	return (
		<Pressable
			className="flex-1 flex-row items-center justify-between border p-3 border-foreground"
			onPress={() => {
				router.push({
					pathname: "/(onboarding)/add-asset",
					params: { type: asset.id },
				});
			}}
		>
			<View className="flex-row items-center justify-between gap-2 flex-1">
				<View className="flex-row flex-grow items-center gap-3 flex-1">
					<View
						className="aspect-square flex items-center justify-center w-12 bg-secondary">
						<Icon name={asset.icon} size="20" color={Colors.foreground} fallback={null} />
					</View>
					<View className="flex-1">
						<View className="flex-row items-center gap-2">
							<Text className="font-lausanne-regular text-foreground text-base">
								{asset.title}
							</Text>
							{hasAssets && (
								<View className="bg-accent px-2 py-0.5">
									<Text className="font-lausanne-medium text-foreground text-xs">
										{count}
									</Text>
								</View>
							)}
						</View>
						<Text className="font-lausanne-light text-muted-foreground text-sm">
							{asset.description}
						</Text>
					</View>
				</View>
				<PlusIcon color={Colors.foreground} size={16} />
			</View>
		</Pressable>
	);
}