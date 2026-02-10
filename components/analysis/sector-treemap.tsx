import { Colors } from "@/constants/colors";
import { Asset } from "@/types/custom";
import { getAssetValue } from "@/components/assets/asset-config";
import { getNetQuantity } from "@/components/assets/asset-detail-helpers";
import { formatNumber } from "@/utils/numbers";
import React, { useCallback, useMemo } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { useHaptics } from "@/hooks/haptics";
import { PAYWALL_RESULT, showPaywallIfNeeded } from "@/utils/revenue-cat";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { BlurView } from "expo-blur";

// ── Types ────────────────────────────────────────────────────────────────

type SectorItem = {
	name: string;
	percentage: number;
	color: string;
	amount: string;
};

type CellLayout = { x: number; y: number; w: number; h: number; item: SectorItem };

type PriceData = { price: number; currency: string };

// ── Helpers ──────────────────────────────────────────────────────────────

const LIVE_PRICE_TYPES = new Set(["stocks_etfs", "crypto", "precious_metals"]);

function getAssetSymbol(asset: Asset): string {
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

function getAssetCurrentValue(asset: Asset, currentPrices: Record<string, PriceData>): number {
	if (LIVE_PRICE_TYPES.has(asset.type)) {
		const symbol = getAssetSymbol(asset);
		if (symbol && currentPrices[symbol]) {
			return getNetQuantity(asset) * currentPrices[symbol].price;
		}
	}
	return getAssetValue(asset);
}

function getAssetSector(asset: Asset): string {
	switch (asset.type) {
		case "stocks_etfs":
			if (asset.sector) return asset.sector;
			if (asset.tickerType?.toLowerCase() === "etf") return "ETFs";
			return "Other";
		case "crypto":
			return "Cryptocurrency";
		case "real_estate":
			return "Real Estate";
		case "precious_metals":
			return "Metals";
		case "bonds":
			return asset.bondType === "government" ? "Government Bonds" : "Corporate Bonds";
		case "deposits":
		case "cash":
			return "Cash & Deposits";
		case "private_investments":
			return "Alternative Investments";
		default:
			return "Other";
	}
}

// ── Colors (reuse existing asset-type palette) ───────────────────────────

const ASSET_COLORS = {
	stocks_etfs: "#213C51",
	bonds: "#9E3B3B",
	deposits: "#5C8D89",
	precious_metals: "#FAB12F",
	real_estate: "#8B7BA8",
	private_investments: "#116A7B",
	cash: "#7B6079",
	crypto: "#F1935C",
};

const SECTOR_PALETTE: Record<string, string> = {
	"Cryptocurrency": ASSET_COLORS.crypto,
	"Real Estate": ASSET_COLORS.real_estate,
	"Metals": ASSET_COLORS.precious_metals,
	"Government Bonds": ASSET_COLORS.bonds,
	"Corporate Bonds": ASSET_COLORS.bonds,
	"Cash & Deposits": ASSET_COLORS.deposits,
	"Alternative Investments": ASSET_COLORS.private_investments,
	"ETFs": ASSET_COLORS.stocks_etfs,
	"Other": ASSET_COLORS.cash,
};

const STOCK_SECTOR_COLORS = [
	ASSET_COLORS.stocks_etfs,
	ASSET_COLORS.deposits,
	ASSET_COLORS.private_investments,
	ASSET_COLORS.crypto,
	ASSET_COLORS.real_estate,
	ASSET_COLORS.precious_metals,
	ASSET_COLORS.bonds,
	ASSET_COLORS.cash,
];

// ── Treemap layout ───────────────────────────────────────────────────────

const CONTAINER_WIDTH = Dimensions.get("window").width - 36;
const TARGET_HEIGHT = 370;
const MIN_ROW_HEIGHT = 58;
const GRID_GAP = 2; // px between cells

/**
 * Squarified-ish treemap.
 *
 * Uses sqrt-scaled heights so medium sectors (6-13%) are visibly taller
 * than tiny ones (0-3%) while large sectors still dominate.
 * Enforces MIN_ROW_HEIGHT; container height is dynamic.
 * Cells use a minimum width-weight so very tiny items stay readable.
 * Positions are rounded to avoid sub-pixel gaps.
 */
function computeTreemapLayout(
	items: SectorItem[],
	containerWidth: number,
	targetHeight: number,
): { cells: CellLayout[]; height: number } {
	const total = items.reduce((sum, s) => sum + s.percentage, 0);
	if (total === 0) return { cells: [], height: 0 };

	// ── Phase 1: group items into rows ──────────────────────────
	type Row = { items: SectorItem[]; pct: number };
	const rows: Row[] = [];
	let remaining = [...items];

	while (remaining.length > 0) {
		let rowPct = 0;
		const rowItems: SectorItem[] = [];
		const remainingPct = remaining.reduce((s, i) => s + i.percentage, 0);

		for (const item of remaining) {
			rowPct += item.percentage;
			rowItems.push(item);
			if (rowPct / remainingPct >= 0.4 && (rowPct >= 3 || rowItems.length >= 2)) break;
		}

		remaining = remaining.slice(rowItems.length);
		rows.push({ items: rowItems, pct: rowPct });
	}

	// ── Phase 2: compute row heights (sqrt-scaled + minimum) ────
	const sqrtWeights = rows.map((r) => Math.sqrt(Math.max(0.1, r.pct)));
	const totalSqrt = sqrtWeights.reduce((s, w) => s + w, 0);
	const totalGapY = (rows.length - 1) * GRID_GAP;
	const usableHeight = targetHeight - totalGapY;

	const rowHeights = sqrtWeights.map((w) =>
		Math.max(MIN_ROW_HEIGHT, Math.round((w / totalSqrt) * usableHeight)),
	);

	// ── Phase 3: lay out cells ──────────────────────────────────
	const cells: CellLayout[] = [];
	let y = 0;

	for (let r = 0; r < rows.length; r++) {
		const { items: rowItems } = rows[r];
		const rowH = rowHeights[r];
		const totalGapX = (rowItems.length - 1) * GRID_GAP;
		const usableWidth = containerWidth - totalGapX;

		// Minimum effective weight so tiny cells keep readable width
		const MIN_WEIGHT = 0.5;
		const weights = rowItems.map((item) => Math.max(MIN_WEIGHT, item.percentage));
		const totalWeight = weights.reduce((s, w) => s + w, 0);

		let x = 0;
		for (let i = 0; i < rowItems.length; i++) {
			const isLast = i === rowItems.length - 1;
			// Last cell fills to the edge to avoid rounding gaps
			const cellW = isLast
				? containerWidth - x
				: Math.round((weights[i] / totalWeight) * usableWidth);

			cells.push({ x, y, w: cellW, h: rowH, item: rowItems[i] });
			x += cellW + GRID_GAP;
		}

		y += rowH + GRID_GAP;
	}

	// Total height (minus trailing gap)
	return { cells, height: y - GRID_GAP };
}

// ── Component ────────────────────────────────────────────────────────────

type SectorTreemapProps = {
	assets: Asset[];
	isPremium: boolean;
	currentPrices: Record<string, PriceData>;
	userCurrency: string;
};

export const SectorTreemap = React.memo(function SectorTreemap({ assets, isPremium, currentPrices, userCurrency }: SectorTreemapProps) {
	const { triggerHaptics } = useHaptics();

	const sectors = useMemo(() => {
		const sectorMap = new Map<string, number>();
		let totalValue = 0;

		for (const asset of assets) {
			const value = getAssetCurrentValue(asset, currentPrices);
			if (value <= 0) continue;
			totalValue += value;
			const sector = getAssetSector(asset);
			sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + value);
		}

		let stockColorIdx = 0;
		return Array.from(sectorMap.entries())
			.map(([name, value]) => {
				const color = SECTOR_PALETTE[name]
					?? STOCK_SECTOR_COLORS[stockColorIdx++ % STOCK_SECTOR_COLORS.length];
				return {
					name,
					value,
					percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
					color,
					amount: formatNumber(value, userCurrency),
				};
			})
			.sort((a, b) => b.percentage - a.percentage);
	}, [assets, currentPrices, userCurrency]);

	const { cells, height: treemapHeight } = useMemo(
		() => computeTreemapLayout(sectors, CONTAINER_WIDTH, TARGET_HEIGHT),
		[sectors],
	);

	const upgradeButtonScale = useSharedValue(1);

	const upgradeButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: upgradeButtonScale.value }],
	}));

	const handleUpgradeButtonPressIn = () => {
		upgradeButtonScale.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleUpgradeButtonPressOut = () => {
		upgradeButtonScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleUpgradePress = useCallback(async () => {
		triggerHaptics("Soft");
		const result = await showPaywallIfNeeded();
		if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
			triggerHaptics("Success");
		}
	}, [triggerHaptics]);

	if (sectors.length === 0) return null;

	return (
		<View className="mb-8">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Sector Exposure</Text>

			<View style={{ height: treemapHeight, position: "relative" }}>
				{cells.map((cell, idx) => {
					const large = cell.w >= 90 && cell.h >= 72;
					return (
						<View
							key={idx}
							style={{
								position: "absolute",
								left: Math.round(cell.x),
								top: Math.round(cell.y),
								width: Math.round(cell.w),
								height: Math.round(cell.h),
								backgroundColor: cell.item.color,
							}}
							className="p-2 justify-between"
						>
							{large ? (
								<>
									<Text
										className="text-white font-lausanne-medium"
										style={{ fontSize: 12 }}
										numberOfLines={1}
									>
										{cell.item.name}
									</Text>
									<View>
										<Text className="text-white/90 font-lausanne-bold" style={{ fontSize: 20 }}>
											{Math.round(cell.item.percentage)}%
										</Text>
										<Text
											className="text-white/60 font-lausanne-light"
											style={{ fontSize: 11 }}
											numberOfLines={1}
										>
											{cell.item.amount}
										</Text>
									</View>
								</>
							) : (
								<>
									<Text
										className="text-white font-lausanne-medium"
										style={{ fontSize: 11 }}
										numberOfLines={1}
									>
										{cell.item.name}
									</Text>
									<View>
										<Text className="text-white/90 font-lausanne-bold" style={{ fontSize: 13 }}>
											{Math.round(cell.item.percentage)}%
										</Text>
										<Text
											className="text-white/50 font-lausanne-light"
											style={{ fontSize: 10 }}
											numberOfLines={1}
										>
											{cell.item.amount}
										</Text>
									</View>
								</>
							)}
						</View>
					);
				})}
				{!isPremium && (
					<BlurView intensity={100} tint="light" experimentalBlurMethod="dimezisBlurView" className="absolute inset-0 flex-1 flex-col justify-center items-center">
						<View className="flex-1 flex-col justify-center items-center">
							<Text className="text-foreground text-lg font-lausanne-medium mb-2">Unlock Premium to see the full view</Text>
							<Animated.View style={[upgradeButtonAnimatedStyle]}>
								<Pressable
									onPress={handleUpgradePress}
									onPressIn={handleUpgradeButtonPressIn}
									onPressOut={handleUpgradeButtonPressOut}
									hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									className="bg-accent px-3 py-1.5 flex-row items-center gap-1">
									<Text className="text-foreground text-sm font-lausanne-medium">Upgrade</Text>
									<Icon name="arrow-right-up-line" size="17" color={Colors.foreground} fallback={null} />
								</Pressable>
							</Animated.View>
						</View>
					</BlurView>
				)}
			</View>

		</View>
	);
});
