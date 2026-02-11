import { Asset, AssetOption, AssetType } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { getNetQuantity, getNetAmount, getAvgPurchasePrice } from "./asset-detail-helpers";

// Asset options with colors matching onboarding
export const ASSETS_OPTIONS: AssetOption[] = [
	{
		id: 1,
		title: "Stocks & ETFs",
		description: "Stocks, index funds, ETFs",
		icon: "stock-line",
		assetType: "stocks_etfs",
		bgIcon: "#dbe7f0",
		colorIcon: "#213C51",
	},
	{
		id: 2,
		title: "Bonds & Fixed Income",
		description: "Bonds, treasury bills, fixed income",
		icon: "bank-line",
		assetType: "bonds",
		colorIcon: "#9E3B3B",
		bgIcon: "#f1dada",
	},
	{
		id: 3,
		title: "Deposits",
		description: "Fixed deposits, high-yield accounts",
		icon: "safe-3-line",
		assetType: "deposits",
		colorIcon: "#5C8D89",
		bgIcon: "#e0ebea",
	},
	{
		id: 4,
		title: "Precious Metals",
		description: "Gold, silver (physical or ETFs)",
		icon: "diamond-line",
		assetType: "precious_metals",
		colorIcon: "#FAB12F",
		bgIcon: "#feeccd",
	},
	{
		id: 5,
		title: "Real Estate",
		description: "Properties, REITs, crowdfunding",
		icon: "building-line",
		assetType: "real_estate",
		colorIcon: "#8B7BA8",
		bgIcon: "#f0ebf5",
	},
	{
		id: 6,
		title: "Private Investments",
		description: "Loans, crowdlending, equity stakes",
		icon: "hand-coin-line",
		assetType: "private_investments",
		colorIcon: "#116A7B",
		bgIcon: "#e9f9fc",
	},
	{
		id: 7,
		title: "Cash",
		description: "Cash, checking accounts",
		icon: "cash-line",
		assetType: "cash",
		colorIcon: "#7B6079",
		bgIcon: "#eee9ec",
	},
	{
		id: 8,
		title: "Crypto",
		description: "Bitcoin, Ethereum, others",
		icon: "btc-line",
		assetType: "crypto",
		colorIcon: "#F1935C",
		bgIcon: "#fce7dc",
	},
];

export function getAssetTypeConfig(type: AssetType): AssetOption {
	return ASSETS_OPTIONS.find((opt) => opt.assetType === type) || ASSETS_OPTIONS[0];
}

// getAssetValue is now defined in asset-detail-helpers.ts and re-exported here
export { getAssetValue } from "./asset-detail-helpers";

export function getAssetDisplayName(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return `${(asset as any).ticker} · ${asset.name}`;
		case "crypto":
			return `${(asset as any).symbol} · ${asset.name}`;
		default:
			return asset.name;
	}
}

export function getAssetDisplayValue(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return `${formatNumber(getNetQuantity(asset))} shares @ ${formatNumber(getAvgPurchasePrice(asset), asset.currency)}`;
		case "crypto":
			return `${formatNumber(getNetQuantity(asset))} @ ${formatNumber(getAvgPurchasePrice(asset), asset.currency)}`;
		case "bonds":
		case "deposits":
		case "private_investments":
		case "cash":
			return formatNumber(getNetAmount(asset), asset.currency);
		case "precious_metals":
			if ((asset as any).format === "etf") {
				return `${formatNumber(getNetQuantity(asset))} ${(asset as any).quantityUnit || "units"} @ ${formatNumber(getAvgPurchasePrice(asset), asset.currency)}`;
			}
			return `${formatNumber(getNetQuantity(asset))} ${(asset as any).quantityUnit || "units"}`;
		case "real_estate":
			return formatNumber((asset as any).estimatedValue || 0, asset.currency);
		default:
			return "";
	}
}
