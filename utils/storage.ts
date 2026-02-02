import { Asset, User } from '@/types/custom';
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

export async function clearAssets(): Promise<void> {
	await removeItem('assets');
}

export function generateAssetId(): string {
	return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Security Settings
export async function getBiometricEnabled(): Promise<boolean> {
	const value = await getItem('biometricEnabled');
	return value === true;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
	await setItem('biometricEnabled', enabled);
}