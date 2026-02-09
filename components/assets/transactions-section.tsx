import { Asset, PreciousMetalAsset, Transaction } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { formatDate } from "@/utils/dates";
import { getAssetTransactions, isQuantityBased } from "./asset-detail-helpers";
import React from "react";
import { Text, View } from "react-native";
import Icon from "react-native-remix-icon";

function TransactionItem({ transaction, asset, isLast }: { transaction: Transaction; asset: Asset; isLast: boolean }) {
	const isBuy = transaction.type === "buy";
	const icon = isBuy ? "arrow-down-circle-fill" : "arrow-up-circle-fill";
	const qtyBased = isQuantityBased(asset.type);

	return (
		<View className={`flex-row items-center justify-between py-3 ${isLast ? "" : "border-b border-border"}`}>
			<View className="flex-row items-center gap-3 flex-1 text-green-7">
				<Icon name={icon} size="20" color={isBuy ? "#dc2626" : "#15803d"} fallback={null} />
				<View className="flex-1 gap-0.5">
					<View className="flex-row items-center gap-2">
						<Text className="text-foreground text-sm font-lausanne-medium capitalize">
							{transaction.type}
						</Text>
						{qtyBased && transaction.quantity != null && (
							<Text className="text-muted-foreground text-xs font-lausanne-light mt-0.5">
								{transaction.quantity} {asset.type === "precious_metals" ? ((asset as any).quantityUnit || "units") : "units"}
								{transaction.pricePerUnit != null && (asset.type === "precious_metals" && (asset as PreciousMetalAsset).format !== "physical") && (
									<Text> @ {formatNumber(transaction.pricePerUnit, asset.currency)}</Text>
								)}
							</Text>
						)}
					</View>
					<Text className="text-muted-foreground text-xs font-lausanne-light">
						{formatDate(transaction.date)}
						{transaction.notes ? ` · ${transaction.notes}` : ""}
					</Text>
				</View>
			</View>
			<Text className="text-sm font-lausanne-medium text-foreground">
				{isBuy ? "-" : "+"}
				{formatNumber(transaction.amount, asset.currency)}
			</Text>
		</View>
	);
}

type Props = {
	asset: Asset;
	onAddTransaction: () => void;
};

export function TransactionsSection({ asset, onAddTransaction }: Props) {
	const transactions = getAssetTransactions(asset);

	return (
		<View className="mb-6">
			<Text className="text-foreground text-base font-lausanne-medium mb-2">Transactions</Text>

			{transactions.length === 0 ? (
				<View className="bg-input border border-border px-4 py-6 items-center">
					<Text className="text-muted-foreground text-sm font-lausanne-regular">
						No transactions recorded yet
					</Text>
				</View>
			) : (
				<View className="bg-input border border-border">
					<View className="px-4">
						{transactions.map((transaction, index) => (
							<TransactionItem
								key={transaction.id}
								transaction={transaction}
								asset={asset}
								isLast={index === transactions.length - 1}
							/>
						))}
					</View>
				</View>
			)}
		</View>
	);
}
