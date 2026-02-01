import { Colors } from "@/constants/colors";
import { Asset, AssetOption as AssetOptionType } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { useOnboarding } from "@/utils/onboarding-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";

type AssetOptionProps = {
	asset: AssetOptionType;
	assets: Asset[];
};

// Helper to get display name for an asset
function getAssetDisplayName(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return `${(asset as any).ticker} · ${asset.name}`;
		case "crypto":
			return `${(asset as any).symbol} · ${asset.name}`;
		default:
			return asset.name;
	}
}

// Helper to get display value for an asset
function getAssetDisplayValue(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return `${formatNumber((asset as any).quantity || 0)} shares @ ${asset.currency} ${formatNumber(5800)}`;
		case "crypto":
			return `${formatNumber((asset as any).quantity || 0)} @ ${asset.currency} ${formatNumber((asset as any).purchasePrice || 0)}`;
		case "bonds":
		case "deposits":
		case "private_investments":
		case "cash":
			return `${asset.currency} ${formatNumber((asset as any).amount || 0)}`;
		case "precious_metals":
			return `${formatNumber((asset as any).quantity || 0)} ${(asset as any).quantityUnit || "units"}`;
		case "real_estate":
			return `${asset.currency} ${formatNumber((asset as any).estimatedValue || 0)}`;
		default:
			return "";
	}
}

export function AssetOption({ asset, assets }: AssetOptionProps) {
	const { removePendingAsset } = useOnboarding();
	const hasAssets = assets.length > 0;

	const handleRemoveAsset = (assetId: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		removePendingAsset(assetId);
	};

	return (
		<View className="border border-foreground">
			{/* Main option row */}
			<Pressable
				className="flex-row items-center justify-between p-3"
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
							className="aspect-square flex items-center justify-center w-12"
							style={{ backgroundColor: asset.bgIcon }}
						>
							<Icon name={asset.icon} size="20" color={asset.colorIcon} fallback={null} />
						</View>
						<View className="flex-1">
							<View className="flex-row items-center gap-2">
								<Text className="font-lausanne-regular text-foreground text-base">
									{asset.title}
								</Text>
								{hasAssets && (
									<View className="bg-accent px-2 py-0.5">
										<Text className="font-lausanne-medium text-foreground text-xs">
											{assets.length}
										</Text>
									</View>
								)}
							</View>
							<Text className="font-lausanne-light text-muted-foreground text-sm">
								{asset.description}
							</Text>
						</View>
					</View>
					<Icon name="add-line" size="20" color={Colors.foreground} fallback={null} />
				</View>
			</Pressable>

			{/* Added assets list */}
			{hasAssets && (
				<View className="border-t border-border bg-[#f2f2f2]">
					{assets.map((addedAsset, index) => (
						<View
							key={addedAsset.id}
							className={`flex-row items-center justify-between px-3 py-2 ${index < assets.length - 1 ? "border-b border-border" : ""}`}
						>
							<View className="flex-1 mr-3">
								<Text className="font-lausanne-regular text-foreground text-sm" numberOfLines={1}>
									{getAssetDisplayName(addedAsset)}
								</Text>
								<Text className="font-lausanne-light text-muted-foreground text-xs" numberOfLines={1}>
									{getAssetDisplayValue(addedAsset)}
								</Text>
							</View>
							<Pressable
								onPress={() => handleRemoveAsset(addedAsset.id)}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
								className="p-0.5"
							>
								<Icon name="close-line" size="17" color={Colors.mutedForeground} fallback={null} />
							</Pressable>
						</View>
					))}
				</View>
			)}
		</View>
	);
}