import React, { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import Icon from "react-native-remix-icon";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useHaptics } from "@/hooks/haptics";
import { useSession } from "@/utils/auth-context";
import { setUser } from "@/utils/storage";
import { usersApi } from "@/utils/api/users";
import { Option } from "@/components/onboarding/option";

const CURRENCIES = [
	{ id: 1, title: "USD" },
	{ id: 2, title: "EUR" },
	{ id: 3, title: "GBP" },
	{ id: 4, title: "CHF" },
	{ id: 5, title: "JPY" },
	{ id: 6, title: "CAD" },
	{ id: 7, title: "AUD" },
	{ id: 8, title: "MXN" },
	{ id: 9, title: "BRL" },
];

const DEBOUNCE_MS = 300;

export default function CurrencySettingsScreen() {
	const { triggerHaptics } = useHaptics();
	const { user, updateUser } = useSession();
	const [isSaving, setIsSaving] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const selectedCurrency = user?.currency ?? "USD";

	const saveChanges = async (currency: string) => {
		setIsSaving(true);
		try {
			const response = await usersApi.updateUserInfo({
				userId: user?.id,
				currency,
			});
			if (response.user) {
				await setUser({ ...user, ...response.user });
				await updateUser(response.user);
			}
		} catch (error) {
			console.error(error);
			// Revert optimistic update
			await updateUser({ currency: selectedCurrency });
			Alert.alert("Error", "Failed to save changes, please try again later", [{ text: "OK" }]);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSelectCurrency = (currency: { id: number, title: string }) => {
		if (selectedCurrency === currency.title) {
			return;
		}
		// Optimistic update — context + screens update immediately
		updateUser({ currency: currency.title });
		triggerHaptics("Success");

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			saveChanges(currency.title);
		}, DEBOUNCE_MS);
	};

	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">
					Currency
				</Text>
				<View className="w-[15%] items-end">
					{isSaving && <ActivityIndicator size="small" color={Colors.foreground} />}
				</View>
			</View>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerClassName="pb-safe-offset-10 flex-grow">
				<View className="mb-6 px-5">
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						Your base currency. Choose how to display your total wealth.
					</Text>
				</View>
				{CURRENCIES.map((currency, index) => (
					<Option key={index} option={currency} selected={selectedCurrency === currency.title} onPress={handleSelectCurrency} />
				))}
			</ScrollView>
		</View>
	);
}
