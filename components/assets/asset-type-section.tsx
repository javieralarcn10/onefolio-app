import { Colors } from "@/constants/colors";
import { Asset, AssetType } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { getAssetTypeConfig, getAssetValue } from "./asset-config";
import { AssetItem } from "./asset-item";
import { useEffect, useState } from "react";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";

type AssetTypeSectionProps = {
	type: AssetType;
	assets: Asset[];
	userCurrency?: string;
	onAssetPress: (asset: Asset) => void;
	onAddPress: () => void;
};

export function AssetTypeSection({ type, assets, userCurrency, onAssetPress, onAddPress }: AssetTypeSectionProps) {
	const config = getAssetTypeConfig(type);
	const totalValue = assets.reduce((sum, asset) => sum + getAssetValue(asset), 0);
	const displayCurrency = assets[0]?.currency || "USD";
	const [formattedTotal, setFormattedTotal] = useState(formatNumber(totalValue, displayCurrency));

	useEffect(() => {
		transformNumberToUserCurrency(totalValue, displayCurrency).then(setFormattedTotal);
	}, [totalValue, userCurrency]);

	return (
		<View className="mb-4 border border-foreground">
			{/* Header row - clickable to add more */}
			<Pressable
				onPress={onAddPress}
				className="flex-row items-center justify-between p-3"
			>
				<View className="flex-row items-center gap-3 flex-1">
					<View
						className="w-12 h-12 items-center justify-center"
						style={{ backgroundColor: config.bgIcon }}
					>
						<Icon name={config.icon} size="20" color={config.colorIcon} fallback={null} />
					</View>
					<View className="flex-1">
						<View className="flex-row items-center gap-2">
							<Text className="font-lausanne-regular text-foreground text-base">
								{config.title}
							</Text>
							<View className="bg-accent px-2 py-0.5">
								<Text className="font-lausanne-medium text-foreground text-xs">
									{assets.length}
								</Text>
							</View>
						</View>
						<Text className="font-lausanne-light text-muted-foreground text-sm">
							{formattedTotal}
						</Text>
					</View>
				</View>
				<Icon name="add-line" size="20" color={Colors.foreground} fallback={null} />
			</Pressable>

			{/* Assets list */}
			<View className="border-t border-border bg-[#f2f2f2]">
				{assets.map((asset) => (
					<AssetItem
						key={asset.id}
						asset={asset}
						userCurrency={userCurrency}
						onPress={() => onAssetPress(asset)}
					/>
				))}
			</View>
		</View>
	);
}
