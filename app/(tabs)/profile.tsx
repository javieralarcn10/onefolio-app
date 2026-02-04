import { Colors } from "@/constants/colors";
import { User } from "@/types/custom";
import { getUser, setUser as setUserStorage } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import { useHaptics } from "@/hooks/haptics";
import { PAYWALL_RESULT, showPaywallIfNeeded } from "@/utils/revenue-cat";
import { QuickActions } from "@/components/profile/quick-actions";
import { InvestmentProfile } from "@/components/profile/investment-profile";
import { InviteFriends } from "@/components/profile/invite-friends";

export default function ProfileScreen() {
	const { triggerHaptics } = useHaptics();
	const [user, setUser] = useState<User>();

	const loadData = useCallback(async () => {
		try {
			const userData = await getUser();
			setUser(userData as User);
		} catch (error) {
			console.error("Error loading profile data:", error);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);
	const handleSettingsPress = useCallback(() => {
		router.push("/settings");
	}, []);

	const handleAddEmailPress = useCallback(() => {
		router.push("/account-settings");
	}, []);

	const handleUpgradePress = useCallback(async () => {
		const result = await showPaywallIfNeeded();
		if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
			triggerHaptics("Success");
			if (user) {
				const updatedUser = { ...user, isPremium: true };
				await setUserStorage(updatedUser);
				setUser(updatedUser);
			}
		}
	}, [user, triggerHaptics]);

	const userInitials = useMemo(() => {
		if (!user?.firstName) return "";
		const first = user.firstName.charAt(0)?.toUpperCase() ?? "";
		const second = user.firstName.charAt(1)?.toUpperCase() ?? "";
		return `${first}${second}`;
	}, [user?.firstName]);

	return (
		<View className="flex-1 bg-background">
			<StatusBar style="dark" />

			{/* Header */}
			<View className="pt-safe">
				<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
					<Text className="text-foreground text-2xl font-lausanne-medium">Profile</Text>
					<Pressable onPress={handleSettingsPress} className="w-10 h-10 items-center justify-center">
						<Icon name="list-settings-line" size="24" color={Colors.foreground} fallback={null} />
					</Pressable>
				</View>
			</View>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
				{/* User Card */}
				<View className="px-5 mb-6">
					<View className="bg-foreground p-5">
						<View className="flex-row items-center gap-4">
							<View className="w-14 h-14 bg-accent items-center justify-center">
								<Text className="text-foreground text-xl font-lausanne-semibold">
									{userInitials}
								</Text>
							</View>
							<View className="flex-1">
								<Text className="text-background text-xl font-lausanne-medium">
									{user?.firstName || "Investor"}
								</Text>
								{user?.email ? (
									<Text className="text-background/60 text-sm font-lausanne-light">
										{user.email}
									</Text>
								) : (
									<Pressable onPress={handleAddEmailPress} className="flex-row items-center gap-1">
										<Text className="text-background/60 text-sm font-lausanne-light">
											Add email address
										</Text>
										<Icon name="arrow-right-s-line" size="16" style={{ marginTop: 1.5 }} color="rgba(255,255,255,0.6)" fallback={null} />
									</Pressable>
								)}
							</View>
						</View>

						{/* Plan Badge */}
						<View className="mt-4 pt-4 border-t border-background/10">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<Icon
										name={user?.isPremium ? "vip-crown-2-line" : "vip-crown-line"}
										size="18"
										color={Colors.background}
										fallback={null}
									/>
									<Text className="text-background text-sm font-lausanne-medium">
										{user?.isPremium ? "Premium Plan" : "Free Plan"}
									</Text>
								</View>
								{!user?.isPremium && (
									<Pressable onPress={handleUpgradePress} className="bg-accent px-3 py-1.5 flex-row items-center gap-1">
										<Text className="text-foreground text-sm font-lausanne-medium">Upgrade</Text>
										<Icon name="arrow-right-up-line" size="17" color={Colors.foreground} fallback={null} />
									</Pressable>
								)}
							</View>
						</View>
					</View>
				</View>

				{user && <InvestmentProfile user={user} />}

				<QuickActions />

				{user && <InviteFriends user={user} />}

			</ScrollView>
		</View>
	);
}
