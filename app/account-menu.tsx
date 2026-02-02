import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import Icon from "react-native-remix-icon";

export default function AccountMenuScreen() {
	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">Account</Text>
				<View className="w-[15%]" />
			</View>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 flex-grow">
				<Pressable
					onPress={() => router.push("/account-settings")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="user-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Personal Info</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => router.push("/currency-settings")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="money-dollar-circle-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Currency</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => router.push("/risk-profile-settings")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="swap-2-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Risk Profile</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Pressable
					onPress={() => router.push("/financial-plan-settings")}
					className="flex-row items-center justify-between border-b-[1.1px] border-border py-5 gap-1">
					<View className="flex-row items-center gap-4">
						<Icon name="target-line" size="22" color={Colors.foreground} fallback={null} />
						<Text className="text-foreground text-lg font-lausanne-light leading-normal">Financial Plan</Text>
					</View>
					<Icon name="arrow-right-s-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
			</ScrollView>
		</View>
	);
}
