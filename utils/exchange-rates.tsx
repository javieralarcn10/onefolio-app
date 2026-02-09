import axios from "axios";
import { formatNumber } from "./numbers";
import {
	CachedExchangeRates,
	getExchangeRatesCache,
	getUser,
	removeExchangeRatesCache,
	setExchangeRatesCache,
} from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// In-memory mirror so we don't hit storage on every call
let memoryCache: CachedExchangeRates | null = null;

async function readCache(): Promise<CachedExchangeRates | null> {
	if (memoryCache) return memoryCache;

	const cached = await getExchangeRatesCache();
	if (cached) memoryCache = cached;
	return cached;
}

async function writeCache(data: CachedExchangeRates["data"]): Promise<void> {
	memoryCache = { data, timestamp: Date.now() };
	await setExchangeRatesCache(data);
}

async function getExchangeRates(): Promise<CachedExchangeRates["data"] | null> {
	const cached = await readCache();

	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}

	try {
		const response = await axios.get<CachedExchangeRates["data"]>(
			`${API_URL}/finance/exchange-rates`,
			{ headers: { Accept: "application/json" } },
		);
		await writeCache(response.data);
		return response.data;
	} catch {
		return cached?.data ?? null;
	}
}

export async function invalidateExchangeRatesCache(): Promise<void> {
	memoryCache = null;
	await removeExchangeRatesCache();
}

export async function convertToUserCurrency(amount: number, fromCurrency?: string): Promise<number> {
	const user = await getUser();
	const userCurrency = user?.currency ?? "USD";

	if (fromCurrency && fromCurrency === userCurrency) return amount;

	const rates = await getExchangeRates();
	if (!rates) return amount;

	// Amount is already in the base currency → apply target rate directly
	if (!fromCurrency || fromCurrency === rates.base) {
		const rate = rates.rates[userCurrency];
		return rate ? amount * rate : amount;
	}

	// Convert: fromCurrency → base → userCurrency
	const fromRate = rates.rates[fromCurrency];
	const toRate = rates.rates[userCurrency];
	if (!fromRate || !toRate) return amount;

	return amount * (toRate / fromRate);
}

export async function transformNumberToUserCurrency(amount: number, fromCurrency?: string): Promise<string> {
	const user = await getUser();
	const userCurrency = user?.currency ?? "USD";

	const converted = await convertToUserCurrency(amount, fromCurrency);
	return formatNumber(converted, userCurrency);
}
