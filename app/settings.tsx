import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "@/utils/auth-context";
import { View, Text, Pressable, ScrollView, Linking, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import Constants from "expo-constants";
import { CustomSwitch } from "@/components/custom-switch";
import {
	getHapticsPermission,
	setHapticsPermission,
	removeOnboardingCompleted,
	setBiometricEnabled,
	getBiometricEnabled,
	clearAssets,
	getUser,
	setUser,
} from "@/utils/storage";
import { useHaptics } from "@/hooks/haptics";
import * as Haptics from "expo-haptics";
import {
	checkNotificationPermissions,
	requestNotificationPermissions,
	showEnableNotificationsAlert,
	areNotificationsDenied,
	registerForPushNotificationsAsync,
} from "@/utils/notifications";
import { BiometricType, User } from "@/types/custom";
import * as LocalAuthentication from "expo-local-authentication";
import Icon from "react-native-remix-icon";
import { usersApi } from "@/utils/api/users";

export default function SettingsScreen() {
	const { signOut } = useSession();
	const { setEnabled, triggerHaptics } = useHaptics();
	const [hapticsValue, setHapticsValue] = useState<boolean>(true);
	const [biometricValue, setBiometricValue] = useState<boolean>(true);
	const [notificationsValue, setNotificationsValue] = useState<boolean>(true);
	const [isHydrated, setIsHydrated] = useState(false);
	const shouldSkipNextHapticsEffect = useRef(true);
	const shouldSkipNextBiometricEffect = useRef(true);
	const shouldSkipNextNotificationsEffect = useRef(true);
	const [biometricType, setBiometricType] = useState<BiometricType>("none");
	const originalUser = useRef<User | null>(null);

	const getBiometricLabel = () => {
		if (biometricType === "faceid") {
			return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
		}
		return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
	};

	const checkBiometricSupport = async () => {
		const compatible = await LocalAuthentication.hasHardwareAsync();

		if (compatible) {
			const types =
				await LocalAuthentication.supportedAuthenticationTypesAsync();
			if (
				types.includes(
					LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
				)
			) {
				setBiometricType("faceid");
			} else if (
				types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
			) {
				setBiometricType("fingerprint");
			}
		}
	};


	// Load initial permission states from storage
	useLayoutEffect(() => {
		let isMounted = true;

		checkBiometricSupport();
		const loadPermissions = async () => {
			try {
				const [haptics, biometric, user] = await Promise.all([
					getHapticsPermission(),
					getBiometricEnabled(),
					getUser(),
				]);
				originalUser.current = user;

				if (!isMounted) return;

				const hapticsVal = haptics ?? true;
				const biometricVal = biometric ?? false;

				setHapticsValue(hapticsVal);
				setNotificationsValue(user?.notificationToken ? true : false);
				setBiometricValue(biometricVal);
			} catch (error) {
				console.error("Failed to load permissions from storage", error);
			} finally {
				if (isMounted) {
					shouldSkipNextHapticsEffect.current = true;
					shouldSkipNextNotificationsEffect.current = true;
					shouldSkipNextBiometricEffect.current = true;
					setIsHydrated(true);
				}
			}
		};

		loadPermissions();

		return () => {
			isMounted = false;
		};
	}, []);

	// Persist haptics permission changes and provide feedback
	useEffect(() => {
		if (!isHydrated) return;

		if (shouldSkipNextHapticsEffect.current) {
			shouldSkipNextHapticsEffect.current = false;
			return;
		}

		const updateHapticsPermission = async () => {
			try {
				await setHapticsPermission(hapticsValue);
				setEnabled(hapticsValue);
				if (hapticsValue) {
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				}
			} catch (error) {
				console.error("Failed to persist haptics preference", error);
			}
		};

		updateHapticsPermission();
	}, [hapticsValue, isHydrated]);

	// Persist biometric permission changes and provide feedback
	useEffect(() => {
		if (!isHydrated) return;

		if (shouldSkipNextBiometricEffect.current) {
			shouldSkipNextBiometricEffect.current = false;
			return;
		}

		const updateBiometricPermission = async () => {
			try {
				if (biometricValue === true) {
					handleEnableBiometric();
				} else {
					triggerHaptics("Error");
					await setBiometricEnabled(false);
				}
			} catch (error) {
				console.error("Failed to persist biometric preference", error);
			}
		};

		updateBiometricPermission();
	}, [biometricValue, isHydrated]);

	// Persist notifications permission changes and handle system permissions
	useEffect(() => {
		if (!isHydrated) return;

		if (shouldSkipNextNotificationsEffect.current) {
			shouldSkipNextNotificationsEffect.current = false;
			return;
		}

		const updateNotificationsPermission = async () => {
			try {
				if (notificationsValue) {
					// User is trying to enable notifications
					const hasSystemPermission = await checkNotificationPermissions();

					if (!hasSystemPermission) {
						// Check if permissions were previously denied
						const wasDenied = await areNotificationsDenied();

						if (wasDenied) {
							// User previously denied - need to go to settings
							showEnableNotificationsAlert();
							// Revert the toggle since we can't enable notifications
							setNotificationsValue(false);
							return;
						}

						// Request permission from user
						const granted = await requestNotificationPermissions();

						if (!granted) {
							// User denied permission
							setNotificationsValue(false);
							return;
						}
					}

					// Permission granted
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					if (originalUser.current?.notificationToken == null) {
						const token = await registerForPushNotificationsAsync()
						try {
							const response = await usersApi.updateUserInfo({
								userId: originalUser.current?.id,
								notificationToken: token ?? null,
							});
							if (response.user) {
								const updatedUser = { ...originalUser.current, ...response.user };
								await setUser(updatedUser);
								originalUser.current = updatedUser;
							} else {
								throw new Error("Failed to save changes");
							}
						} catch (error) {
							console.error(error);
							setNotificationsValue(false);
							Alert.alert("Error", "Failed to save changes, please try again later", [{ text: "OK" }]);
						}
					}
				} else {
					// Remove token from server to stop receiving push notifications
					if (originalUser.current?.notificationToken) {
						try {
							const response = await usersApi.updateUserInfo({
								userId: originalUser.current?.id,
								notificationToken: null,
							});
							if (response.user) {
								await setUser({ ...originalUser.current, ...response.user, notificationToken: null });
								originalUser.current = { ...originalUser.current, notificationToken: null };
							}
						} catch (error) {
							console.error("Failed to remove notification token:", error);
						}
					}
				}
			} catch (error) {
				console.error("Failed to update notifications preference", error);
			}
		};

		updateNotificationsPermission();
	}, [notificationsValue, isHydrated]);

	const handleEnableBiometric = async () => {
		const result = await LocalAuthentication.authenticateAsync({
			promptMessage: `Enable ${getBiometricLabel()}`,
			fallbackLabel: "Use passcode",
			cancelLabel: "Cancel",
		});

		if (result.success) {
			triggerHaptics("Success");
			await setBiometricEnabled(true);
		} else {
			triggerHaptics("Error");
		}
	};

	const confirmLogout = () => {
		Alert.alert(
			"Log out of Onefolio?",
			"You'll need to sign in again to access your personalized experience. Are you sure you want to log out?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Logout",
					style: "destructive",
					onPress: async () => {
						await setBiometricEnabled(false);
						await clearAssets()
						await removeOnboardingCompleted();
						signOut();
					},
				},
			],
		);
	};

	const confirmDeleteAccount = () => {
		Alert.alert(
			"Delete Account",
			"Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete Account",
					style: "destructive",
					onPress: async () => {
						await setBiometricEnabled(false);
						await clearAssets()
						await removeOnboardingCompleted();
						signOut();
					},
				},
			],
		);
	};

	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">
					Settings
				</Text>
				<View className="w-[15%]" />
			</View>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 flex-grow">
				<Pressable
					onPress={() => router.push("/account-menu")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="user-settings-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Account</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<View className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="notification-2-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Notifications</Text>
					</View>
					<CustomSwitch value={notificationsValue} onValueChange={setNotificationsValue} />
				</View>
				<View className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						{/* <VibrateIcon color={Colors.foreground} weight="regular" size={22} /> */}
						<Icon name="volume-vibrate-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Haptics</Text>
					</View>
					<CustomSwitch value={hapticsValue} onValueChange={setHapticsValue} />
				</View>
				<View className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						{biometricType === "faceid" ? (
							<Icon name="emotion-line" size="22" color={Colors.foreground} fallback={null} />
						) : (
							<Icon name="fingerprint-line" size="22" color={Colors.foreground} fallback={null} />
						)}
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">{getBiometricLabel()}</Text>
					</View>
					<CustomSwitch value={biometricValue} onValueChange={setBiometricValue} />
				</View>
				<Pressable
					onPress={() => Linking.openURL("mailto:support@onefolio.app")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="customer-service-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Help</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => Linking.openURL("https://onefolio.app/terms-of-service")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="auction-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Terms & Conditions</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => Linking.openURL("https://onefolio.app/privacy-policy")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="file-text-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Privacy Policy</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => confirmLogout()}
					className="flex-row items-center justify-between border-b-[1.1px] border-border  py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="logout-box-line" size="22" color="#b91c1c" fallback={null} />
						<Text className="text-red-700 text-lg font-lausanne-light leading-normal">Log out</Text>
					</View>
				</Pressable>
				{/* <Pressable onPress={() => confirmDeleteAccount()} className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="delete-bin-line" size="22" color="#b91c1c" fallback={null} />
						<Text className="text-red-700 text-lg font-lausanne-light leading-normal">Delete Account</Text>
					</View>
				</Pressable> */}

				<Text className="text-muted-foreground text-sm font-manrope leading-normal mt-6">Version {Constants.expoConfig?.version}</Text>
			</ScrollView>
		</View>
	);
}