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
		staleTime: 24 * 60 * 60 * 1000,
		gcTime: 24 * 60 * 60 * 1000,
		retry: 1,
	});
}