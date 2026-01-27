import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';


// Configure how notifications behave when app is in foreground
// Set all to false so notifications don't show when app is open
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: false,
		shouldPlaySound: false,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: false,
	}),
});

// ============================================================================
// Permission Functions
// ============================================================================

/**
 * Request notification permissions from the user
 * @returns Whether permission was granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
	const { status: existingStatus } = await Notifications.getPermissionsAsync();

	if (existingStatus === Notifications.PermissionStatus.GRANTED) {
		return true;
	}

	const { status } = await Notifications.requestPermissionsAsync();
	return status === Notifications.PermissionStatus.GRANTED;
}

/**
 * Check if notification permissions are granted at the system level
 * @returns Whether permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
	const { status } = await Notifications.getPermissionsAsync();
	return status === Notifications.PermissionStatus.GRANTED;
}

/**
 * Check if notifications have been denied (user explicitly said no)
 * @returns Whether permissions were denied
 */
export async function areNotificationsDenied(): Promise<boolean> {
	const { status } = await Notifications.getPermissionsAsync();
	return status === Notifications.PermissionStatus.DENIED;
}

/**
 * Open app settings so user can enable notifications
 */
export function openNotificationSettings(): void {
	if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
}

/**
 * Show alert prompting user to enable notifications in settings
 */
export function showEnableNotificationsAlert(): void {
	Alert.alert(
		"Notifications Disabled",
		"To receive daily learning reminders, please enable notifications in your device settings.",
		[
			{ text: "Cancel", style: "cancel" },
			{ text: "Open Settings", onPress: openNotificationSettings },
		]
	);
}

/**
 * Clear the badge count on the app icon
 */
export async function clearBadgeCount(): Promise<void> {
	try {
		await Notifications.setBadgeCountAsync(0);
	} catch (error) {
		console.error('Error clearing badge count:', error);
	}
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Enable notifications - checks permissions and schedules if allowed
 * Shows alert to open settings if permissions were denied
 * @returns Whether notifications were successfully enabled
 */
export async function enableNotifications(): Promise<boolean> {
	// First check if permissions were previously denied
	const isDenied = await areNotificationsDenied();

	if (isDenied) {
		// User previously denied, need to go to settings
		showEnableNotificationsAlert();
		return false;
	}

	// Try to request permissions
	const granted = await requestNotificationPermissions();
	return granted;
}

/**
 * Disable notifications - cancels all scheduled notifications
 */
export async function disableNotifications(): Promise<void> {
	await clearBadgeCount();
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
	let token = null;

	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('defaultChannel', {
			name: 'A channel is needed for the permissions prompt to appear',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		});
	}

	if (Device.isDevice) {
		try {
			const projectId =
				Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
			if (!projectId) {
				throw new Error('Project ID not found');
			}
			token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

		} catch (e) {
			console.error('Error getting push token:', e);
			return null;
		}
	} else {
		alert('Must use physical device for Push Notifications');
	}

	return token;
}
