import { getAssetTypeConfig } from "@/components/assets/asset-config";
import { transformNumberToUserCurrency } from "@/utils/exchange-rates";
import { AssetType } from "@/types/custom";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Icon from "react-native-remix-icon";

type AssetDistributionItem = {
	type: string;
	value: number;
	currency: string;
	percentage: number;
};

type Props = {
	distribution: AssetDistributionItem[];
};

export function AssetAllocation({ distribution }: Props) {
	const [formattedValues, setFormattedValues] = useState<Record<string, string>>({});

	useEffect(() => {
		const formatValues = async () => {
			const entries = await Promise.all(
				distribution.map(async (item) => {
					const formatted = await transformNumberToUserCurrency(item.value, item.currency);
					return [item.type, formatted] as const;
				})
			);
			setFormattedValues(Object.fromEntries(entries));
		};
		formatValues();
	}, [distribution]);

	if (distribution.length === 0) return null;

	return (
		<View className="mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Asset Distribution</Text>

			<View className="bg-input border border-border p-4 gap-4">
				{distribution.map((item) => {
					const config = getAssetTypeConfig(item.type as AssetType);
					return (
						<View key={item.type} className="flex-row items-center gap-3">
							<View
								className="w-10 h-10 items-center justify-center"
								style={{ backgroundColor: config.bgIcon }}
							>
								<Icon name={config.icon} size="19" color={config.colorIcon} fallback={null} />
							</View>
							<View className="flex-1">
								<View className="flex-row items-center justify-between mb-0.5">
									<Text className="text-foreground text-sm font-lausanne-medium">
										{config.title}
									</Text>
									<Text className="text-foreground text-sm font-lausanne-semibold">
										{item.percentage}%
									</Text>
								</View>
								<View className="flex-row items-center justify-between gap-2">
									<View className="flex-1 max-w-[50%] h-2 bg-border overflow-hidden">
										<View
											className="h-full"
											style={{
												width: `${item.percentage}%`,
												backgroundColor: config.colorIcon,
											}}
										/>
									</View>
									<Text className="text-muted-foreground text-xs font-lausanne-light">
										{formattedValues[item.type] ?? ""}
									</Text>
								</View>
							</View>
						</View>
					);
				})}
			</View>
		</View>
	);
}
