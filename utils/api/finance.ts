import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type SearchResult = {
	symbol: string;
	name: string;
	type: string;
	exchange: string;
	sector: string;
	industry: string;
	price: number;
	currency: string;
	country: string;
};

async function searchAssets(query: string, type: "stocks" | "crypto"): Promise<SearchResult[]> {
	const response = await axios.get<SearchResult[]>(`${API_URL}/finance/search`, {
		params: { q: query, type },
		headers: { Accept: "application/json" },
	});
	return response.data;
}

export function useAssetSearch(query: string, type: "stocks" | "crypto") {
	const trimmed = query.trim();

	return useQuery<SearchResult[]>({
		queryKey: ["asset-search", type, trimmed],
		queryFn: () => searchAssets(trimmed, type),
		enabled: trimmed.length > 0,
		staleTime: 5 * 60 * 1000, // 5 min — cached results stay fresh
		gcTime: 10 * 60 * 1000,   // 10 min — keep unused cache entries
		placeholderData: (prev) => prev, // keep previous results while fetching
		retry: 1,
	});
}

// ── Price History ────────────────────────────────────────────────────────

export type PriceHistoryPoint = {
	date: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	change: number;
	change_percent: number;
};

export type PriceHistoryResponse = {
	symbol: string;
	currency: string;
	interval: string;
	range: string;
	total_records: number;
	data: PriceHistoryPoint[];
};

export type CurrentPriceResponse = {
	symbol: string;
	name: string;
	current_price: number;
	previous_close: number;
	change: number;
	change_percent: number;
	currency: string;
	timestamp: string;
};

export type CurrentPriceBulkResponse = {
	[symbol: string]: CurrentPriceResponse | null;
};

export type AnalystRatingTrend = {
	period: string;
	total_analysts: number;
	strong_buy: number;
	buy: number;
	hold: number;
	sell: number;
	strong_sell: number;
};

export type AnalystRatingResponse = {
	symbol: string;
	recommendation_trends: AnalystRatingTrend[];
};

export type NewsItem = {
	title: string;
	publisher: string;
	link: string;
	date: string;
	summary: string;
};

export type NewsResponse = {
	symbol: string;
	total: number;
	news: NewsItem[];
};

export type NewsBulkResponse = {
	[symbol: string]: NewsResponse | null;
};

export type HistoryPeriod = "1d" | "5d" | "1mo" | "6mo" | "1y" | "5y";
export type HistoryInterval = "5m" | "1h" | "90m" | "1d" | "1wk" | "1mo";

/** Maps each UI period to the API period + interval */
export const PERIOD_CONFIG: Record<string, { period: HistoryPeriod; interval: HistoryInterval }> = {
	"1D": { period: "1d", interval: "5m" },
	"5D": { period: "5d", interval: "1h" },
	"1M": { period: "1mo", interval: "1d" },
	"6M": { period: "6mo", interval: "1d" },
	"1Y": { period: "1y", interval: "1wk" },
	"5Y": { period: "5y", interval: "1mo" },
};

async function fetchPriceHistory(
	symbol: string,
	period: HistoryPeriod,
	interval: HistoryInterval,
): Promise<PriceHistoryResponse> {
	const response = await axios.get<PriceHistoryResponse>(
		`${API_URL}/finance/history/${symbol}`,
		{
			params: { period, interval },
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function usePriceHistory(symbol: string, uiPeriod: string, enabled: boolean = true) {
	const config = PERIOD_CONFIG[uiPeriod] ?? PERIOD_CONFIG["1D"];

	return useQuery<PriceHistoryResponse>({
		queryKey: ["price-history", symbol, config.period, config.interval],
		queryFn: () => fetchPriceHistory(symbol, config.period, config.interval),
		enabled: enabled && symbol.length > 0,
		staleTime: 15 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
		retry: 1,
	});
}

export async function fetchCurrentPrice(
	symbol: string
): Promise<CurrentPriceResponse> {
	const response = await axios.get<CurrentPriceResponse>(
		`${API_URL}/finance/price/${symbol}`,
		{
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function useCurrentPrice(symbol: string, enabled: boolean = true) {
	return useQuery<CurrentPriceResponse>({
		queryKey: ["current-price", symbol],
		queryFn: () => fetchCurrentPrice(symbol),
		enabled: enabled && symbol.length > 0,
		staleTime: 15 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
		retry: 1,
	});
}

async function fetchAnalystRating(
	symbol: string
): Promise<AnalystRatingResponse> {
	const response = await axios.get<AnalystRatingResponse>(
		`${API_URL}/finance/analyst/${symbol}`,
		{
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function useAnalystRating(symbol: string, enabled: boolean = true) {
	return useQuery<AnalystRatingResponse>({
		queryKey: ["analyst-rating", symbol],
		queryFn: () => fetchAnalystRating(symbol),
		enabled: enabled && symbol.length > 0,
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		retry: 1,
	});
}

export async function fetchNews(
	symbol: string
): Promise<NewsResponse> {
	const response = await axios.get<NewsResponse>(
		`${API_URL}/finance/news/${symbol}`,
		{
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function useNews(symbol: string, enabled: boolean = true) {
	return useQuery<NewsResponse>({
		queryKey: ["news", symbol],
		queryFn: () => fetchNews(symbol),
		enabled: enabled && symbol.length > 0,
		staleTime: 2 * 60 * 60 * 1000,
		gcTime: 2 * 60 * 60 * 1000,
		retry: 1,
	});
}


async function fetchCurrentPriceBulk(
	symbols: string
): Promise<CurrentPriceBulkResponse> {
	const response = await axios.get<CurrentPriceBulkResponse>(
		`${API_URL}/finance/prices-bulk?symbols=${symbols}`,
		{
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function useCurrentPriceBulk(symbols: string, enabled: boolean = true) {
	return useQuery<CurrentPriceBulkResponse>({
		queryKey: ["current-price-bulk", symbols],
		queryFn: () => fetchCurrentPriceBulk(symbols),
		enabled: enabled && symbols.length > 0,
		staleTime: 15 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
		retry: 1,
	});
}

async function fetchNewsBulk(
	symbols: string
): Promise<NewsBulkResponse> {
	const response = await axios.get<NewsBulkResponse>(
		`${API_URL}/finance/news-bulk?symbols=${symbols}`,
		{
			headers: { Accept: "application/json" },
		},
	);
	return response.data;
}

export function useNewsBulk(symbols: string, enabled: boolean = true) {
	return useQuery<NewsBulkResponse>({
		queryKey: ["news-bulk", symbols],
		queryFn: () => fetchNewsBulk(symbols),
		enabled: enabled && symbols.length > 0,
		staleTime: 6 * 60 * 60 * 1000,
		gcTime: 6 * 60 * 60 * 1000,
		retry: 1,
	});
}

// ── Portfolio History ────────────────────────────────────────────────────

/**
 * Represents a single asset in the portfolio-history request.
 *
 * • Live-price assets (stocks, crypto, metals): symbol + quantity.
 * • Interest-bearing assets (bonds, deposits, private investments):
 *   staticValue + interestRate / expectedReturn + maturityDate so the
 *   backend can compute daily accrual.
 * • Flat-value assets (cash, real estate): staticValue only.
 */
export type PortfolioAssetPayload = {
	symbol: string | null;
	quantity: number | null;
	quantityUnit?: 'oz' | 'g' | null;
	purchaseDate: string;
	type: string;
	staticValue: number | null;
	currency: string;

	// Interest-bearing assets (bonds, deposits)
	interestRate?: number | null;   // annual % (e.g. 4.5)
	maturityDate?: string | null;

	// Private investments
	expectedReturn?: number | null; // annual % (e.g. 8.0)
	investmentType?: string | null; // 'loan' | 'crowdlending' | 'equity' | 'other'

	// Bonds
	bondType?: string | null;       // 'government' | 'corporate'
};

export type PortfolioHistoryRequest = {
	assets: PortfolioAssetPayload[];
	period: string;          // "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL"
	targetCurrency: string;  // user's display currency, e.g. "USD"
};

export type PortfolioHistoryPoint = {
	date: string;
	value: number;
};

export type PortfolioHistoryResponse = {
	data: PortfolioHistoryPoint[];
	currency: string;
};

async function fetchPortfolioHistory(
	payload: PortfolioHistoryRequest,
): Promise<PortfolioHistoryResponse> {
	const response = await axios.post<PortfolioHistoryResponse>(
		`${API_URL}/finance/portfolio-history`,
		payload,
		{
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		},
	);
	return response.data;
}

/**
 * Fetches the aggregated portfolio value over time.
 * The backend receives every asset in the portfolio, fetches their individual
 * price histories in parallel, and returns a single aggregated time-series.
 */
export function usePortfolioHistory(
	payload: PortfolioHistoryRequest | null,
	enabled: boolean = true,
) {
	// Build a stable, human-readable key that captures the asset composition.
	const assetsKey = payload?.assets
		?.map((a) => `${a.symbol ?? a.type}:${a.quantity ?? a.staticValue}`)
		.sort()
		.join("|") ?? "";

	return useQuery<PortfolioHistoryResponse>({
		queryKey: ["portfolio-history", payload?.period, payload?.targetCurrency, assetsKey],
		queryFn: () => fetchPortfolioHistory(payload!),
		enabled: enabled && payload !== null && payload.assets.length > 0,
		staleTime: 15 * 60 * 1000,  // 15 min
		gcTime: 30 * 60 * 1000,     // 30 min
		retry: 1,
	});
}