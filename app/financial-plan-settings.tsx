import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { Option } from "@/components/onboarding/option";
import { OnboardingOption } from "@/types/custom";
import { useHaptics } from "@/hooks/haptics";
import { useSession } from "@/utils/auth-context";
import { setUser } from "@/utils/storage";
import { usersApi } from "@/utils/api/users";
import Icon from "react-native-remix-icon";

const GOAL_OPTIONS = [
	{
		id: 1,
		title: "Protect against inflation",
	},
	{
		id: 2,
		title: "Diversify across countries",
	},
	{
		id: 3,
		title: "Reduce currency risk",
	},
	{
		id: 4,
		title: "Understand my geopolitical exposure",
	},
	{
		id: 5,
		title: "Track unlisted assets",
	},
] as const;

const DEBOUNCE_MS = 500;

function getInitialSelectedIds(investmentGoals?: string): Set<number> {
	const ids = new Set<number>();
	if (investmentGoals) {
		investmentGoals.split(",").map((g) => g.trim()).forEach((goal) => {
			const option = GOAL_OPTIONS.find((opt) => opt.title === goal);
			if (option) ids.add(option.id);
		});
	}
	return ids;
}

export default function GoalsSettingsScreen() {
	const { triggerHaptics } = useHaptics();
	const { user, updateUser } = useSession();
	const [selectedIds, setSelectedIds] = useState<Set<number>>(() => getInitialSelectedIds(user?.investmentGoals));
	const [isSaving, setIsSaving] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const saveChanges = async (ids: Set<number>) => {
		const newGoals = Array.from(ids)
			.map((id) => GOAL_OPTIONS.find((opt) => opt.id === id)?.title)
			.filter(Boolean) as string[];

		const investmentGoals = newGoals.length > 0 ? newGoals.join(",") : null;

		setIsSaving(true);
		try {
			const response = await usersApi.updateUserInfo({
				userId: user?.id,
				investmentGoals,
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
			const newSelectedIds = new Set(selectedIds);
			const isCurrentlySelected = newSelectedIds.has(option.id);

			// Prevent deselecting if it's the last selected option
			if (isCurrentlySelected && newSelectedIds.size === 1) {
				triggerHaptics("Error");
				return;
			}

			if (isCurrentlySelected) {
				newSelectedIds.delete(option.id);
			} else {
				newSelectedIds.add(option.id);
			}

			setSelectedIds(newSelectedIds);
			triggerHaptics("Success");

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}

			debounceRef.current = setTimeout(() => {
				saveChanges(newSelectedIds);
			}, DEBOUNCE_MS);
		},
		[selectedIds, triggerHaptics]
	);

	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">Financial Plan</Text>
				<View className="w-[15%] items-end">
					{isSaving && <ActivityIndicator size="small" color={Colors.foreground} />}
				</View>
			</View>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-safe-offset-10 flex-grow">
				<View className="mb-6 px-5">
					<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">
						Choose what matters to you. You can select multiple options, but we recommend focusing on 2 or 3.
					</Text>
				</View>
				{GOAL_OPTIONS.map((option) => (
					<Option key={option.id} option={option} selected={selectedIds.has(option.id)} onPress={handleSelectOption} />
				))}
			</ScrollView>
		</View>
	);
}
