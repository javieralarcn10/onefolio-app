import { Asset } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { Pressable, Text, View } from "react-native";
import { getAssetDisplayName, getAssetDisplayValue, getAssetValue } from "./asset-config";
import { useEffect, useState } from "react";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";

type AssetItemProps = {
	asset: Asset;
	userCurrency?: string;
	onPress: () => void;
	isLast: boolean;
};

export function AssetItem({ asset, userCurrency, isLast, onPress }: AssetItemProps) {
	const value = getAssetValue(asset);
	const [formattedValue, setFormattedValue] = useState(formatNumber(value, asset.currency));

	useEffect(() => {
		transformNumberToUserCurrency(value, asset.currency).then(setFormattedValue);
	}, [value, userCurrency]);

	return (
		<Pressable
			onPress={onPress}
			className={`flex-row items-center justify-between px-3 py-2.5 ${isLast ? "" : "border-b border-border"}`}
		>
			<View className="flex-1 mr-3">
				<Text className="font-lausanne-regular text-foreground text-sm" numberOfLines={1}>
					{getAssetDisplayName(asset)}
				</Text>
				<Text className="font-lausanne-light text-muted-foreground text-xs" numberOfLines={1}>
					{getAssetDisplayValue(asset)}
				</Text>
			</View>
			<View className="items-end">
				<Text className="text-foreground text-sm font-lausanne-medium">
					{formattedValue}
				</Text>
			</View>
		</Pressable>
	);
}
