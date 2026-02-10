import { buildInitialTransaction } from '@/components/assets/asset-detail-helpers';
import { Asset, Transaction, User } from '@/types/custom';
import Storage from 'expo-sqlite/kv-store';

async function setItem(key: string, value: any) {
	await Storage.setItem(key, JSON.stringify(value));
}

async function getItem(key: string) {
	const value = await Storage.getItem(key);
	if (!value) return null;
	return JSON.parse(value);
}


async function removeItem(key: string) {
	await Storage.removeItem(key);
}

export async function hasCompletedOnboarding() {
	const value = await getItem('onboardingCompleted');
	return value === true;
}

export async function setOnboardingCompleted() {
	await setItem('onboardingCompleted', true);
}

export async function removeOnboardingCompleted() {
	await removeItem('onboardingCompleted');
}

export async function getAppleUser() {
	const value = await getItem('appleUser');
	return value;
}

export async function setAppleUser(user: any) {
	await setItem('appleUser', user);
}

export async function getUser(): Promise<User | null> {
	const value = await getItem('user');
	return value;
}

export async function setUser(user: any) {
	await setItem('user', user);
}

export async function removeUser() {
	await removeItem('user');
}

export async function getHapticsPermission() {
	const value = await getItem('hapticsPermission');
	return value;
}

export async function setHapticsPermission(hapticsPermission: boolean) {
	await setItem('hapticsPermission', hapticsPermission);
}

// Assets Management
export async function getAssets(): Promise<Asset[]> {
	const value = await getItem('assets');
	return value || [];
}

/** Synchronous version – avoids async flash on first render */
export function getAssetsSync(): Asset[] {
	try {
		const raw = Storage.getItemSync('assets');
		if (!raw) return [];
		return JSON.parse(raw) as Asset[];
	} catch {
		return [];
	}
}

export async function addAsset(asset: Asset): Promise<void> {
	const assets = await getAssets();
	assets.push(asset);
	await setItem('assets', assets);
}

export async function updateAsset(updatedAsset: Asset): Promise<void> {
	const assets = await getAssets();
	const index = assets.findIndex(a => a.id === updatedAsset.id);
	if (index !== -1) {
		assets[index] = updatedAsset;
		await setItem('assets', assets);
	}
}

export async function removeAsset(assetId: string): Promise<void> {
	const assets = await getAssets();
	const filteredAssets = assets.filter(a => a.id !== assetId);
	await setItem('assets', filteredAssets);
}

export async function addTransactionToAsset(assetId: string, transaction: Transaction): Promise<void> {
	const assets = await getAssets();
	const index = assets.findIndex(a => a.id === assetId);
	if (index !== -1) {
		const asset = assets[index];
		if (!asset.transactions || asset.transactions.length === 0) {
			// First real transaction: migrate legacy purchase data as the initial buy
			asset.transactions = [buildInitialTransaction(asset)];
		}
		asset.transactions.push(transaction);
		asset.updatedAt = new Date().toISOString();
		assets[index] = asset;
		await setItem('assets', assets);
	}
}

export async function clearAssets(): Promise<void> {
	await removeItem('assets');
}

export function generateAssetId(): string {
	return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Exchange Rates Cache
export type CachedExchangeRates = {
	data: {
		success: boolean;
		date: string;
		base: string;
		rates: Record<string, number>;
	};
	timestamp: number;
};

export async function getExchangeRatesCache(): Promise<CachedExchangeRates | null> {
	const raw = await Storage.getItem('exchangeRates');
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export async function setExchangeRatesCache(data: CachedExchangeRates['data']): Promise<void> {
	const entry: CachedExchangeRates = { data, timestamp: Date.now() };
	await setItem('exchangeRates', entry);
}

export async function removeExchangeRatesCache(): Promise<void> {
	await removeItem('exchangeRates');
}

// Security Settings
export async function getBiometricEnabled(): Promise<boolean> {
	const value = await getItem('biometricEnabled');
	return value === true;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
	await setItem('biometricEnabled', enabled);
}