import React, { useLayoutEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useHaptics } from "@/hooks/haptics";
import { getUser, setUser } from "@/utils/storage";
import { usersApi } from "@/utils/api/users";
import { User } from "@/types/custom";
import Icon from "react-native-remix-icon";

const URL_PATTERN = /^https?:\/\/|www\.|\.(?:com|net|org|edu|gov|io|co|es|mx|app|dev)\b/i;
const VALID_NAME_PATTERN = /^[\p{L}\s\-']+$/u;
const MIN_LENGTH_DEBOUNCE_MS = 500;

export default function AccountSettingsScreen() {
	const { triggerHaptics } = useHaptics();
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [nameError, setNameError] = useState("");
	const [email, setEmail] = useState("");
	const originalUser = useRef<User | null>(null);
	const emailInput = useRef<TextInput>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadUser = async () => {
		const user = await getUser();
		setName(user?.firstName ?? "");
		setEmail(user?.email ?? "");
		originalUser.current = user;
	};

	useLayoutEffect(() => {
		loadUser();
	}, []);

	const validateImmediate = (value: string): string | null => {
		const trimmed = value.trim();
		if (!trimmed) return null;

		if (URL_PATTERN.test(trimmed)) return "Please enter a valid name, not a URL";
		if (/\d/.test(trimmed)) return "Name cannot contain numbers";
		if (!VALID_NAME_PATTERN.test(trimmed)) return "Name can only contain letters, spaces, hyphens and apostrophes";
		if (trimmed.length > 50) return "Name must be less than 50 characters";

		return null;
	};

	const handleNameChange = (text: string) => {
		setName(text);

		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}

		const immediateError = validateImmediate(text);
		if (immediateError) {
			setNameError(immediateError);
			return;
		}

		const trimmed = text.trim();
		if (trimmed.length >= 2 || !trimmed) {
			setNameError("");
			return;
		}

		debounceRef.current = setTimeout(() => {
			if (trimmed.length > 0 && trimmed.length < 2) {
				setNameError("Name must be at least 2 characters");
			}
		}, MIN_LENGTH_DEBOUNCE_MS);
	};

	const isNameValid = name.trim().length >= 2 && !validateImmediate(name);

	const isFormFilled = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return email !== "" ? isNameValid && emailRegex.test(email.trim()) : isNameValid;
	};

	const hasChanges = () => {
		return name !== originalUser.current?.firstName || email !== originalUser.current?.email;
	};

	const handleSaveChanges = async () => {
		setIsLoading(true);
		try {
			const response = await usersApi.updateUserInfo({
				userId: originalUser.current?.id,
				firstName: name?.trim(),
				email: email?.trim() || null,
			});
			if (response.user) {
				await setUser({ ...originalUser.current, ...response.user });
				triggerHaptics("Success");
				router.back();
			} else {
				throw new Error("Failed to save changes");
			}
		} catch (error) {
			console.error(error);
			Alert.alert("Error", "Failed to save changes, please try again later", [{ text: "OK" }]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View className="flex-1 mt-safe">
			<View className="px-5 pt-5 pb-4 flex-row items-center justify-between">
				<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
					<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
				</Pressable>
				<Text className="text-foreground text-2xl font-lausanne-regular leading-none">
					Account Settings
				</Text>
				<View className="w-[15%]" />
			</View>
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				bottomOffset={40}
				showsVerticalScrollIndicator={false}
				contentContainerClassName="py-6 px-5 flex-grow">
				<Text className="font-lausanne-regular text-foreground text-sm mb-0">First Name</Text>
				<TextInput
					autoCorrect={false}
					onChangeText={handleNameChange}
					value={name}
					allowFontScaling={false}
					onSubmitEditing={() => emailInput.current?.focus()}
					enterKeyHint="next"
					enablesReturnKeyAutomatically={true}
					textContentType="name"
					autoComplete="name-given"
					placeholder="Enter your first name"
					placeholderTextColor={Colors.placeholder}
					className={`bg-background border-b ${nameError ? "border-red-600" : "border-foreground"} text-foreground font-lausanne-light`}
					style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
				/>
				{nameError !== "" && (
					<Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
						<Text className="text-red-600 text-sm font-lausanne-regular mt-2 mb-5">
							{nameError}
						</Text>
					</Animated.View>
				)}
				{nameError === "" && <View className="mb-7" />}
				<Text className="font-lausanne-regular text-foreground text-sm mb-0">Email</Text>
				<TextInput
					ref={emailInput}
					autoCorrect={false}
					value={email}
					onChangeText={setEmail}
					allowFontScaling={false}
					enterKeyHint="done"
					enablesReturnKeyAutomatically={true}
					textContentType="emailAddress"
					autoComplete="email"
					autoCapitalize="none"
					keyboardType="email-address"
					placeholder="Enter your email address"
					placeholderTextColor={Colors.placeholder}
					className={`bg-background border-b border-foreground text-foreground font-lausanne-light mb-10`}
					style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
				/>
				<View className="flex-row items-center justify-center gap-2">
					<Pressable
						onPress={() => router.back()}
						disabled={isLoading}
						className={`flex-1 bg-secondary flex-row items-center justify-center gap-3 py-4 border border-secondary ${isLoading ? "opacity-50" : ""
							}`}>
						<View className="flex-row items-center justify-center gap-3">
							<Text className="text-foreground font-lausanne-light text-xl">Cancel</Text>
						</View>
					</Pressable>
					<Pressable
						onPress={handleSaveChanges}
						disabled={isLoading || !isFormFilled()}
						className={`flex-1 bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${!isFormFilled() || !hasChanges() ? "opacity-50" : ""
							}`}>
						{isLoading ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
						) : (
							<View className="flex-row items-center justify-center gap-3">
								<Text className="text-background font-lausanne-light text-xl">Save</Text>
								<Icon name="check-line" size={23} color={Colors.accent} fallback={null} />
							</View>
						)}
					</Pressable>
				</View>
			</KeyboardAwareScrollView>
		</View>
	);
}
