import { Text, View, Pressable, Share } from "react-native";
import { Colors } from "@/constants/colors";
import Icon from "react-native-remix-icon";
import { User } from "@/types/custom";
import { Image } from "expo-image";
import { useHaptics } from "@/hooks/haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

export function InviteFriends({ user }: { user: User }) {
	const { triggerHaptics } = useHaptics();

	const shareButtonScale = useSharedValue(1);

	const shareButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: shareButtonScale.value }],
	}));

	const handleShareButtonPressIn = () => {
		shareButtonScale.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleShareButtonPressOut = () => {
		shareButtonScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleShare = async () => {
		triggerHaptics("Soft");
		try {
			await Share.share({
				message: "I use Onefolio to track my investments across markets and regions. Check it out if you want full visibility over your portfolio.",
				url: "https://onefolio.app/invite?referralCode=" + user.referralCode,
			});
		} catch (error) {
			console.error("Error sharing:", error);
		}
	};

	return (
		<View className="px-5">
			<Text className="text-foreground text-lg font-lausanne-medium mb-2">Invite Friends</Text>
			<View className="border border-foreground bg-accent p-4">
				<View className="flex-row items-center justify-center">
					<Image
						source={{ uri: 'friends' }}
						style={{ width: 180, height: 140 }}
						contentFit="contain"
					/>
				</View>
				<View className="mt-4 mb-6">
					<Text className="text-foreground text-xl text-center font-lausanne-semibold">
						{user.isPremium ? "Help your friends invest smarter" : "Earn Premium by inviting friends"}
					</Text>
				</View>

				<View className="mb-6">
					{user.isPremium ? (
						<>
							<View className="flex-row items-center gap-4 mb-4">
								<View className="aspect-square flex items-center justify-center w-12 bg-foreground">
									<Icon name="global-line" size="20" color={Colors.background} fallback={null} />
								</View>
								<View className="flex-1">
									<Text className="text-foreground text-base font-lausanne-medium">Share the clarity</Text>
									<Text className="text-muted-foreground text-sm font-lausanne-light leading-tight">
										Invite friends so they can also track and protect their investments in one place.
									</Text>
								</View>
							</View>
							<View className="flex-row items-center gap-4 mb-4">
								<View className="aspect-square flex items-center justify-center w-12 bg-foreground">
									<Icon name="shield-check-line" size="20" color={Colors.background} fallback={null} />
								</View>
								<View className="flex-1">
									<Text className="text-foreground text-base font-lausanne-medium">Stay informed</Text>
									<Text className="text-muted-foreground text-sm font-lausanne-light leading-tight">
										Every referral helps us build a better product for everyone.
									</Text>
								</View>
							</View>
						</>
					) : (
						<>
							<View className="flex-row items-center gap-4 mb-4">
								<View className="aspect-square flex items-center justify-center w-12 bg-foreground">
									<Icon name="global-line" size="20" color={Colors.background} fallback={null} />
								</View>
								<View className="flex-1">
									<Text className="text-foreground text-base font-lausanne-medium">They track smarter</Text>
									<Text className="text-muted-foreground text-sm font-lausanne-light leading-tight">
										Friends get full access to see their portfolio across regions and markets.
									</Text>
								</View>
							</View>
							<View className="flex-row items-center gap-4 mb-4">
								<View className="aspect-square flex items-center justify-center w-12 bg-foreground">
									<Icon name="gift-line" size="20" color={Colors.background} fallback={null} />
								</View>
								<View className="flex-1">
									<Text className="text-foreground text-base font-lausanne-medium">You get rewarded</Text>
									<Text className="text-muted-foreground text-sm font-lausanne-light leading-tight">
										1 month free of Premium when your friend subscribes.
									</Text>
								</View>
							</View>
						</>
					)}
				</View>

				{/* Share Button */}
				<Animated.View style={[shareButtonAnimatedStyle]}>
					<Pressable
						onPress={handleShare}
						onPressIn={handleShareButtonPressIn}
						onPressOut={handleShareButtonPressOut}
						className="bg-foreground flex-row items-center justify-center gap-3 py-3 border border-foreground"
					>
						<Text className="text-background font-lausanne-light text-lg">Share invite link</Text>
						<Icon name="link" size="18" color={Colors.accent} fallback={null} />
					</Pressable>
				</Animated.View>

			</View>
		</View>
	);
}
