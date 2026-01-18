import { User } from '@/types/custom';
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

export async function getNotificationsPermission() {
	const value = await getItem('notificationsPermission');
	return value;
}

export async function setNotificationsPermission(notificationsPermission: boolean) {
	await setItem('notificationsPermission', notificationsPermission);
}

export async function setNotifications(notifications: boolean) {
	await setItem('notifications', notifications);
}

export async function removeNotifications() {
	await removeItem('notifications');
}