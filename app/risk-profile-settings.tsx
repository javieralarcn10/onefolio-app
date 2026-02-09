import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { Option } from "@/components/onboarding/option";
import { OnboardingOption } from "@/types/custom";
import { useHaptics } from "@/hooks/haptics";
import { useSession } from "@/utils/auth-context";
import { setUser } from "@/utils/storage";
import { usersApi } from "@/utils/api/users";
import Icon from "react-native-remix-icon";
import { ScrollView } from "react-native";

const INVESTMENT_OPTIONS = [
	{
		id: 1,
		title: "Preserve my capital",
	},
	{
		id: 2,
		title: "Balance risk across regions",
	},
	{
		id: 3,
		title: "Grow wealth long term",
	},
] as const;

const DEBOUNCE_MS = 300;

export default function InvestorProfileSettingsScreen() {
	const { triggerHaptics } = useHaptics();
	const { user, updateUser } = useSession();
	const initialOptionId = user?.investorProfile
		? INVESTMENT_OPTIONS.find((opt) => opt.title === user.investorProfile)?.id ?? null
		: null;
	const [selectedId, setSelectedId] = useState<number | null>(initialOptionId);
	const [isSaving, setIsSaving] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const saveChanges = async (newSelectedId: number | null) => {
		const newProfile = newSelectedId !== null
			? INVESTMENT_OPTIONS.find((opt) => opt.id === newSelectedId)?.title
			: null;

		setIsSaving(true);
		try {
			const response = await usersApi.updateUserInfo({
				userId: user?.id,
				investorProfile: newProfile ?? null,
			});
			if (response.user) {
				await setUser({ ...user, ...response.user });
				await updateUser(response.user);
			}
		} catch (error) {
			console.error(error);
			Alert.alert("Error", "Failed to save changes, please try again later", [{ text: "OK" }]);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSelectOption = useCallback(
		(option: OnboardingOption) => {
			const newSelectedId = selectedId === option.id ? null : option.id;
			setSelectedId(newSelectedId);
			triggerHaptics("Success");

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				saveChanges(newSelectedId);
			}, DEBOUNCE_MS);
		},
		[selectedId, triggerHaptics]
	);

	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">Risk Profile</Text>
				<View className="w-[15%] items-end">
					{isSaving && <ActivityIndicator size="small" color={Colors.foreground} />}
				</View>
			</View>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-safe-offset-10 flex-grow">
				<View className="mb-6 px-5">
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						What matters most to you? This helps us show you the right insights.
					</Text>
				</View>
				{INVESTMENT_OPTIONS.map((option) => (
					<Option key={option.id} option={option} selected={selectedId === option.id} onPress={handleSelectOption} />
				))}
			</ScrollView>
		</View>
	);
}
