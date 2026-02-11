import { Asset, BondAsset, DepositAsset, Transaction } from "@/types/custom";
import { formatNumber } from "@/utils/numbers";
import { formatDate } from "@/utils/dates";

// ── Precious metals price conversion ─────────────────────────────────────

/** 1 troy ounce = 31.1035 grams */
const TROY_OZ_IN_GRAMS = 31.1035;

/** 1 avoirdupois (regular) ounce = 28.3495 grams */
const REGULAR_OZ_IN_GRAMS = 28.3495;

// ── Shared live-price helpers ────────────────────────────────────────────

export type PriceData = { price: number; currency: string };

/** Asset types that support live price fetching */
export const LIVE_PRICE_TYPES = new Set(["stocks_etfs", "crypto", "precious_metals"]);

/** Get the ticker/symbol used to fetch the current price for an asset */
export function getAssetSymbol(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			return asset.ticker;
		case "crypto":
			return asset.symbol;
		case "precious_metals":
			switch (asset.metalType) {
				case "gold": return "GC=F";
				case "silver": return "SI=F";
				case "platinum": return "PL=F";
				case "palladium": return "PA=F";
				default: return "";
			}
		default:
			return "";
	}
}

/**
 * Convert a futures price (per troy ounce) to the correct price per unit
 * for a physical precious metal based on the asset's quantityUnit.
 *
 * The API tickers (GC=F, SI=F, PL=F, PA=F) return prices per **troy ounce**.
 * Users enter physical metals in either:
 *   - 'oz'  → regular (avoirdupois) ounces — 1 troy oz ≈ 1.097 regular oz
 *   - 'g'   → grams                        — 1 troy oz = 31.1035 g
 *
 * For ETF-format metals and all other asset types the price is returned as-is.
 */
export function getMetalPricePerUnit(asset: Asset, pricePerTroyOz: number): number {
	if (asset.type !== "precious_metals" || asset.format !== "physical") {
		return pricePerTroyOz;
	}

	switch (asset.quantityUnit) {
		case "g":
			// price per gram = price per troy oz / grams in a troy oz
			return pricePerTroyOz / TROY_OZ_IN_GRAMS;
		case "oz":
			// price per regular oz = price per troy oz × (regular oz weight / troy oz weight)
			return pricePerTroyOz * (REGULAR_OZ_IN_GRAMS / TROY_OZ_IN_GRAMS);
		default:
			return pricePerTroyOz;
	}
}

/** Cost basis value of an asset (quantity × avg purchase price, or net amount) */
export function getAssetValue(asset: Asset): number {
	switch (asset.type) {
		case "stocks_etfs":
			return getNetQuantity(asset) * getAvgPurchasePrice(asset);
		case "bonds":
		case "deposits":
		case "private_investments":
		case "cash":
			return getNetAmount(asset);
		case "precious_metals":
			return getNetQuantity(asset) * getAvgPurchasePrice(asset);
		case "real_estate":
			return asset.estimatedValue;
		case "crypto":
			return getNetQuantity(asset) * getAvgPurchasePrice(asset);
		default:
			return 0;
	}
}

/** Get the current value of an asset using live prices when available */
export function getAssetCurrentValue(asset: Asset, currentPrices: Record<string, PriceData>): number {
	if (LIVE_PRICE_TYPES.has(asset.type)) {
		const symbol = getAssetSymbol(asset);
		if (symbol && currentPrices[symbol]) {
			const pricePerUnit = getMetalPricePerUnit(asset, currentPrices[symbol].price);
			return getNetQuantity(asset) * pricePerUnit;
		}
	}
	return getAssetValue(asset);
}

export function getAssetDetails(asset: Asset): { label: string; value: string }[] {
	const details: { label: string; value: string }[] = [];

	switch (asset.type) {
		case "stocks_etfs":
			details.push({ label: "Ticker", value: asset.ticker });
			details.push({ label: "Type", value: asset.tickerType ?? 'Unknown' });
			details.push({ label: "Quantity", value: formatNumber(getNetQuantity(asset)) });
			details.push({ label: "Avg. Purchase Price", value: formatNumber(getAvgPurchasePrice(asset), asset.currency) });
			details.push({ label: "Current Price", value: '' });
			break;
		case "crypto":
			details.push({ label: "Symbol", value: asset.symbol });
			details.push({ label: "Type", value: 'Cryptocurrency' });
			details.push({ label: "Quantity", value: formatNumber(getNetQuantity(asset)) });
			details.push({ label: "Avg. Purchase Price", value: formatNumber(getAvgPurchasePrice(asset), asset.currency) });
			details.push({ label: "Current Price", value: '' });
			break;
		case "bonds":
			details.push({ label: "Amount", value: formatNumber(getNetAmount(asset), asset.currency) });
			if (asset.interestRate) {
				details.push({ label: "Interest Rate", value: `${asset.interestRate}%` });
			}
			if (asset.maturityDate) {
				details.push({ label: "Maturity Date", value: formatDate(asset.maturityDate) });
			}
			break;
		case "deposits":
			details.push({ label: "Bank", value: asset.bankName });
			details.push({ label: "Amount", value: formatNumber(getNetAmount(asset), asset.currency) });
			if (asset.interestRate) {
				details.push({ label: "Interest Rate", value: `${asset.interestRate}% APY` });
			}
			if (asset.maturityDate) {
				details.push({ label: "Maturity Date", value: formatDate(asset.maturityDate) });
			}
			break;
		case "precious_metals":
			details.push({ label: "Metal Type", value: asset.metalType.charAt(0).toUpperCase() + asset.metalType.slice(1) });
			details.push({ label: "Format", value: asset.format == 'etf' ? 'ETF' : 'Physical' });
			details.push({ label: "Quantity", value: `${formatNumber(getNetQuantity(asset))} ${asset.quantityUnit || "units"}` });
			if (asset.format === "etf") {
				details.push({ label: "Avg. Purchase Price", value: formatNumber(getAvgPurchasePrice(asset), asset.currency) });
			}
			details.push({ label: "Current Price", value: '' });
			break;
		case "real_estate":
			details.push({ label: "Property Type", value: asset.propertyType.charAt(0).toUpperCase() + asset.propertyType.slice(1) });
			details.push({ label: "Value", value: formatNumber(asset.estimatedValue, asset.currency) });
			if (asset.purchaseDate) {
				details.push({ label: "Purchase Date", value: formatDate(asset.purchaseDate) });
			}
			break;
		case "private_investments":
			details.push({ label: "Investment Type", value: asset.investmentType.charAt(0).toUpperCase() + asset.investmentType.slice(1) });
			details.push({ label: "Amount", value: formatNumber(getNetAmount(asset), asset.currency) });
			if (asset.expectedReturn) {
				details.push({ label: "Expected Return", value: `${asset.expectedReturn}%` });
			}
			if (asset.maturityDate) {
				details.push({ label: "Maturity Date", value: formatDate(asset.maturityDate) });
			}
			break;
		case "cash":
			details.push({ label: "Account", value: asset.accountName });
			details.push({ label: "Amount", value: formatNumber(getNetAmount(asset), asset.currency) });
			break;
	}

	return details;
}

// ── Transaction helpers ──────────────────────────────────────────────────

/** Whether this asset type tracks quantity (vs amount) */
export function isQuantityBased(type: string): boolean {
	return type === "stocks_etfs" || type === "crypto" || type === "precious_metals";
}

/** Whether this asset is a physical precious metal (indivisible — sold as a whole) */
export function isPhysicalMetal(asset: Asset): boolean {
	return asset.type === "precious_metals" && (asset as any).format === "physical";
}

/** Whether this asset is indivisible (sold as a whole unit, no partial sales or buys) */
export function isIndivisibleAsset(asset: Asset): boolean {
	return isPhysicalMetal(asset) || asset.type === "real_estate";
}

/**
 * Build a synthetic initial "buy" transaction from legacy asset data.
 * Used for backward-compat when the asset has no transactions array yet.
 */
export function buildInitialTransaction(asset: Asset): Transaction {
	const base: Transaction = {
		id: `tx_initial_${asset.id}`,
		type: "buy",
		date: (asset as any).purchaseDate || asset.createdAt,
		amount: 0,
	};

	switch (asset.type) {
		case "stocks_etfs":
			base.quantity = asset.quantity;
			base.pricePerUnit = asset.purchasePrice;
			base.amount = asset.quantity * asset.purchasePrice;
			break;
		case "crypto":
			base.quantity = asset.quantity;
			base.pricePerUnit = asset.purchasePrice;
			base.amount = asset.quantity * asset.purchasePrice;
			break;
		case "precious_metals":
			base.quantity = asset.quantity;
			base.pricePerUnit = asset.purchasePrice;
			base.amount = asset.quantity * asset.purchasePrice;
			break;
		case "bonds":
			base.amount = asset.amount;
			break;
		case "deposits":
			base.amount = asset.amount;
			break;
		case "private_investments":
			base.amount = asset.amount;
			break;
		case "cash":
			base.amount = asset.amount;
			break;
		case "real_estate":
			base.amount = asset.estimatedValue;
			break;
		default:
			break;
	}

	base.notes = "Initial purchase";
	return base;
}

/**
 * Get the resolved list of transactions for an asset.
 * If the asset already has stored transactions, return those.
 * Otherwise, synthesise a single "buy" from the legacy fields.
 */
export function getAssetTransactions(asset: Asset): Transaction[] {
	if (asset.transactions && asset.transactions.length > 0) {
		// Sort newest first
		return [...asset.transactions].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	}

	return [buildInitialTransaction(asset)];
}

/**
 * Get the net quantity held (buys - sells).
 * For quantity-based assets only.
 */
export function getNetQuantity(asset: Asset): number {
	const txns = getAssetTransactions(asset);
	let net = 0;
	for (const tx of txns) {
		const qty = tx.quantity ?? 0;
		if (tx.type === "buy") net += qty;
		else if (tx.type === "sell") net -= qty;
	}
	// If no transactions exist (legacy), fall back to the asset field
	if (txns.length === 0 && isQuantityBased(asset.type)) {
		return (asset as any).quantity ?? 0;
	}
	return Math.max(0, net);
}

/**
 * Get the net amount held (buys - sells).
 * For amount-based assets only.
 */
export function getNetAmount(asset: Asset): number {
	const txns = getAssetTransactions(asset);
	let net = 0;
	for (const tx of txns) {
		if (tx.type === "buy") net += tx.amount;
		else if (tx.type === "sell") net -= tx.amount;
	}
	if (txns.length === 0) {
		return (asset as any).amount ?? 0;
	}
	return Math.max(0, net);
}

/**
 * Weighted-average purchase price for quantity-based assets (stocks, crypto, ETF metals).
 * avgPrice = Σ(buy_qty × buy_price) / Σ(buy_qty)
 * Sells reduce the position but do NOT change the average cost basis.
 */
export function getAvgPurchasePrice(asset: Asset): number {
	const txns = getAssetTransactions(asset);
	let totalCost = 0;
	let totalQty = 0;

	for (const tx of txns) {
		if (tx.type === "buy" && tx.quantity && tx.pricePerUnit) {
			totalCost += tx.quantity * tx.pricePerUnit;
			totalQty += tx.quantity;
		}
	}

	if (totalQty === 0) {
		// Fallback to legacy field
		return (asset as any).purchasePrice ?? 0;
	}

	return totalCost / totalQty;
}

/**
 * Whether the asset has been fully sold.
 *
 * - Quantity-based assets (stocks, crypto, ETF metals): fully sold when
 *   net quantity <= 0 (partial sells allowed).
 * - Cash: divisible amount-based — fully sold only when net amount <= 0.
 * - Other amount-based / indivisible assets (real estate, bonds, deposits,
 *   private investments, physical metals): ANY sell transaction means
 *   fully sold. The sale amount is just the price obtained (profit or loss).
 */
export function isFullySold(asset: Asset): boolean {
	const txns = getAssetTransactions(asset);
	const hasSells = txns.some(t => t.type === "sell");
	if (!hasSells) return false;

	// Quantity-based (and NOT indivisible): check net quantity
	if (isQuantityBased(asset.type) && !isIndivisibleAsset(asset)) {
		return getNetQuantity(asset) <= 0;
	}

	// Cash is divisible: only fully sold when net amount reaches 0
	if (asset.type === "cash") {
		return getNetAmount(asset) <= 0;
	}

	// Amount-based / indivisible: any sell = fully sold
	return true;
}

/** Generate a unique transaction id */
export function generateTransactionId(): string {
	return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getSectorInfo(asset: Asset) {
	switch (asset.type) {
		case "stocks_etfs":
			const data: { sector?: string; industry?: string; country?: string; exchange?: string } = {};
			if (asset.sector) {
				data.sector = asset.sector;
			}
			if (asset.industry) {
				data.industry = asset.industry;
			}
			if (asset.country) {
				data.country = asset.country;
			}
			if (asset.exchange) {
				data.exchange = asset.exchange;
			}
			return data
		case "bonds":
			const bondData: { type?: string; country?: string } = {};
			if (asset.bondType) {
				bondData.type = asset.bondType === "government" ? "Government Bond" : "Corporate Bond";
			}
			if (asset.bondCountry) {
				bondData.country = asset.bondCountry;
			}
			return bondData;
		case "real_estate":
			return {
				location: `${asset.city}, ${asset.country}`,
				zipCode: asset.zip,
			};
		default:
			return null;
	}
}

// ── Interest Accrual Chart Data ──────────────────────────────────────────

/**
 * Generates daily accrual chart data for bonds / deposits that have
 * a purchase date (or creation date) and an interest rate.
 * Uses simple daily compounding: value_t = principal * (1 + rate/365)^days
 */
export function generateInterestAccrualData(
	asset: BondAsset | DepositAsset,
): { x: number; y: number; extraData?: any }[] {
	const principal = asset.amount;
	const annualRate = asset.interestRate;

	if (!principal || !annualRate) return [];

	const startStr =
		asset.type === "bonds"
			? asset.purchaseDate
			: (asset.purchaseDate || asset.createdAt);
	if (!startStr) return [];

	const start = new Date(startStr);
	const end = new Date(); // today

	if (isNaN(start.getTime())) return [];

	const dailyRate = annualRate / 100 / 365;
	const msPerDay = 24 * 60 * 60 * 1000;
	const totalDays = Math.max(
		1,
		Math.ceil((end.getTime() - start.getTime()) / msPerDay),
	);

	// Keep it reasonable — at most ~365 points
	const step = Math.max(1, Math.floor(totalDays / 365));
	const points: { x: number; y: number; extraData?: any }[] = [];

	for (let d = 0; d <= totalDays; d += step) {
		const dateMs = start.getTime() + d * msPerDay;
		const value = principal * Math.pow(1 + dailyRate, d);
		points.push({
			x: dateMs,
			y: value,
			extraData: {
				formattedTime: new Date(dateMs).toLocaleDateString(),
			},
		});
	}

	// Ensure the last point is today
	const lastMs = points[points.length - 1]?.x;
	if (lastMs && lastMs < end.getTime() - msPerDay) {
		const value = principal * Math.pow(1 + dailyRate, totalDays);
		points.push({
			x: end.getTime(),
			y: value,
			extraData: {
				formattedTime: end.toLocaleDateString(),
			},
		});
	}

	return points;
}

/** Whether an asset type supports the API-based price chart */
export function supportsLiveChart(type: string): boolean {
	return type === "stocks_etfs" || type === "precious_metals" || type === "crypto";
}

/** Whether an asset can generate an interest accrual chart */
export function supportsAccrualChart(asset: Asset): boolean {
	if (asset.type === "bonds" && asset.purchaseDate && asset.interestRate) return true;
	if (asset.type === "deposits" && asset.interestRate) return true;
	return false;
}
