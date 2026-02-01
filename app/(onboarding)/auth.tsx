import { router } from "expo-router";
import React, { useLayoutEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as Device from 'expo-device';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import {
	getAppleUser,
	hasCompletedOnboarding,
	setAppleUser,
	setOnboardingCompleted,
	setUser,
} from "@/utils/storage";
import { Colors } from "@/constants/colors";
import { useSession } from "@/utils/auth-context";
import { KeyboardAwareScrollView, KeyboardToolbar } from "react-native-keyboard-controller";
import { getLocales, getCalendars } from "expo-localization";
import { StatusBar } from "expo-status-bar";
import { usersApi } from "@/utils/api/users";
import { useHaptics } from "@/hooks/haptics";
import { getCustomerInfo, setRevenueCatUserId } from "@/utils/revenue-cat";
import Icon from "react-native-remix-icon";

// ============================================================================
// Component
// ============================================================================

export default function AuthScreen() {
	const { triggerHaptics } = useHaptics();
	const { languageCode } = getLocales()[0];
	const { timeZone } = getCalendars()[0];
	const { signIn } = useSession();
	const emailInput = useRef<TextInput>(null);
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
	const [isLoadingApple, setIsLoadingApple] = useState(false);
	const [completedOnboarding, setCompletedOnboarding] = useState(false);

	const checkOnboardingCompleted = async () => {
		const completedOnboarding = await hasCompletedOnboarding();
		setCompletedOnboarding(completedOnboarding);
	};

	const markOnboardingCompleted = async () => {
		const completedOnboarding = await hasCompletedOnboarding();
		if (!completedOnboarding) {
			await setOnboardingCompleted();
		}
	};


	useLayoutEffect(() => {
		checkOnboardingCompleted();
	}, []);

	const handleSignIn = async () => {
		Keyboard.dismiss();
		setIsLoading(true);

		try {
			const apiResponse = await usersApi.sentEmailOTP({ email: email.trim() });
			if (apiResponse.message) {
				triggerHaptics("Light");
				router.push({
					pathname: "/(onboarding)/email-otp",
					params: {
						email: email.trim(),
					},
				});
			} else {
				throw new Error("Error sending email OTP");
			}
		} catch (error) {
			triggerHaptics("Error");
			console.error("Error handleSignIn: ", error);
			Alert.alert("Error", "An error occurred while trying to sign in. Please try again in a few minutes.", [{ text: "OK" }]);
		} finally {
			setIsLoading(false);
		}
	};

	const signInWithGoogle = async () => {
		setIsLoadingGoogle(true);
		try {
			await GoogleSignin.hasPlayServices();
			const googleResponse = await GoogleSignin.signIn();
			const userInfo = googleResponse.data?.user;

			if (userInfo) {
				const user: any = {
					firstName: userInfo.givenName?.trim() ?? null,
					email: userInfo.email,
					googleId: userInfo.id,
					device: `${Device.manufacturer} ${Device.modelName}`
				};

				const customerInfo = await getCustomerInfo();
				if (customerInfo && customerInfo.originalAppUserId) {
					user.revenueCatId = customerInfo.originalAppUserId;
				}

				const apiResponse = await usersApi.signInWithGoogle(user);
				if (apiResponse.user) {
					if (apiResponse.user.accessToken) {
						await markOnboardingCompleted();
						await setUser(apiResponse.user);
						await setRevenueCatUserId({ userId: apiResponse.user.id, email: apiResponse.user.email, firstName: apiResponse.user.firstName });
						await signIn();
						triggerHaptics("Success");
						router.replace({ pathname: "/(tabs)" });
					} else {
						router.replace({ pathname: "/(onboarding)/step-1", params: { name: apiResponse.user.firstName, email: apiResponse.user.email, googleId: user.googleId } });
					}
				} else {
					throw new Error("Error signing in with Google");
				}
			}
		} catch (error) {
			triggerHaptics("Error");
			console.error("Error signInWithGoogle: ", error);
			Alert.alert("Error", "An error occurred while trying to sign in with Google. Please try again in a few minutes.", [{ text: "OK" }]);
		} finally {
			setIsLoadingGoogle(false);
		}
	};

	const signInWithApple = async () => {
		setIsLoadingApple(true);
		try {
			const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
				requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
			});

			let appleUser = await getAppleUser();
			if (!appleUser) {
				appleUser = {
					firstName: appleAuthRequestResponse.fullName?.givenName?.trim() ?? null,
					email: appleAuthRequestResponse.email,
					appleId: appleAuthRequestResponse.user,
					device: `${Device.manufacturer} ${Device.modelName}`
				};
				await setAppleUser(appleUser);
			}
			const customerInfo = await getCustomerInfo();
			if (customerInfo && customerInfo.originalAppUserId) {
				appleUser.revenueCatId = customerInfo.originalAppUserId;
			}

			const apiResponse = await usersApi.signInWithApple(appleUser);
			if (apiResponse.user) {
				if (apiResponse.user.accessToken) {
					await markOnboardingCompleted();
					await setUser(apiResponse.user);
					await setRevenueCatUserId({ userId: apiResponse.user.id, email: apiResponse.user.email, firstName: apiResponse.user.firstName });
					await signIn();
					triggerHaptics("Success");
					router.replace({ pathname: "/(tabs)" });
				} else {
					router.replace({ pathname: "/(onboarding)/step-1", params: { name: apiResponse.user.firstName, email: apiResponse.user.email, appleId: appleUser.appleId } });
				}
			} else {
				throw new Error("Error signing in with Apple");
			}
		} catch (error) {
			triggerHaptics("Error");
			console.error("Error signInWithApple: ", error);
			Alert.alert("Error", "An error occurred while trying to sign in with Apple. Please try again in a few minutes.", [{ text: "OK" }]);
		} finally {
			setIsLoadingApple(false);
		}
	};

	const isFormFilled = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email.trim());
	};

	return (
		<>
			<View className="flex-1 py-safe">
				<StatusBar style="dark" />

				{/* Header */}
				<View className="px-5 pt-5 flex-row items-center justify-between">
					<Pressable className="w-[15%] py-1" onPress={() => router.back()}>
						<Icon name="arrow-left-line" size="24" color={Colors.foreground} fallback={null} />
					</Pressable>
					<Text className="text-muted-foreground text-sm text-center font-lausanne-regular leading-normal">
						Sign in
					</Text>
					<View className="w-[15%]" />
				</View>



				{/* Content */}
				<KeyboardAwareScrollView
					keyboardShouldPersistTaps="handled"
					bottomOffset={40}
					showsVerticalScrollIndicator={false}
					contentContainerClassName="py-6 px-5 flex-grow">

					{/* Header */}
					<View className="mb-8">
						<Text className="text-2xl font-lausanne-medium text-foreground leading-snug mb-2">The world keeps moving</Text>
						<Text className="text-lg font-lausanne-light text-muted-foreground leading-normal">Sign in to see how global events are shaping your wealth.</Text>
					</View>

					<TextInput
						autoCorrect={false}
						ref={emailInput}
						onChangeText={setEmail}
						allowFontScaling={false}
						onSubmitEditing={handleSignIn}
						enterKeyHint="done"
						enablesReturnKeyAutomatically={true}
						textContentType="emailAddress"
						keyboardType="email-address"
						autoComplete="email"
						autoCapitalize="none"
						placeholder="Enter your email address"
						placeholderTextColor={Colors.placeholder}
						className="bg-background border-b border-foreground text-foreground font-lausanne-light mb-8"
						style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
					/>
					<Pressable
						onPress={handleSignIn}
						disabled={isLoading || isLoadingGoogle || isLoadingApple || !isFormFilled()}
						className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${!isFormFilled() ? "opacity-50" : ""
							}`}>
						{isLoading ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
						) : (
							<Text className="text-background font-lausanne-light text-xl">Continue</Text>
						)}
					</Pressable>
					<View className="flex-row items-center justify-center gap-4 my-6 px-2">
						<View className="flex-1 h-px bg-border" />
						<Text className="text-muted-foreground text-base text-center font-lausanne-light leading-4">or</Text>
						<View className="flex-1 h-px bg-border" />
					</View>
					<Pressable
						onPress={signInWithApple}
						disabled={isLoading || isLoadingGoogle || isLoadingApple}
						className="bg-background border border-border flex-row items-center justify-center gap-3 py-4 mb-2">
						{isLoadingApple ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.foreground} />
						) : (
							<>
								<Image source={{ uri: 'apple-logo' }} style={{ width: 18, height: 18 }} contentFit="contain" />
								<Text className="text-foreground font-lausanne-light text-lg">Continue with Apple</Text>
							</>
						)}
					</Pressable>
					<Pressable
						onPress={signInWithGoogle}
						disabled={isLoading || isLoadingGoogle || isLoadingApple}
						className="bg-background border border-border flex-row items-center justify-center gap-3 py-4">
						{isLoadingGoogle ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.foreground} />
						) : (
							<>
								<Image source={{ uri: 'google-logo' }} style={{ width: 18, height: 18 }} contentFit="contain" />
								<Text className="text-foreground font-lausanne-light text-lg">Continue with Google</Text>
							</>
						)}
					</Pressable>
				</KeyboardAwareScrollView>
			</View>
			<KeyboardToolbar />
		</>
	);
}