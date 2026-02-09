import { Colors } from "@/constants/colors";
import { Pressable, Text, View } from "react-native";
import Icon from "react-native-remix-icon";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

type EmptyStateProps = {
	onAddPress: () => void;
};

export function EmptyState({ onAddPress }: EmptyStateProps) {
	const buttonScale = useSharedValue(1);

	const buttonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScale.value }],
	}));

	const handlePressIn = () => {
		buttonScale.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handlePressOut = () => {
		buttonScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	return (
		<View className="flex-1 items-center justify-center px-5 pb-5">
			<View className="bg-secondary w-16 aspect-square items-center justify-center mb-4">
				<Icon name="folder-open-line" size="26" color={Colors.foreground} fallback={null} />
			</View>
			<Text className="text-foreground text-lg font-lausanne-medium text-center mb-2">
				No assets yet
			</Text>
			<Text className="text-muted-foreground text-base font-lausanne-light text-center mb-6">
				Start building your portfolio to see your global exposure and risk analysis.
			</Text>
			<Animated.View className="w-full" style={[buttonAnimatedStyle]}>
				<Pressable
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					onPress={onAddPress}
					className="bg-foreground flex-row items-center justify-center gap-2 px-6 py-4"
				>
					<Text className="text-background font-lausanne-regular text-lg">Add your first asset</Text>
					<Icon name="add-line" size="20" color={Colors.accent} fallback={null} />
				</Pressable>
			</Animated.View>
		</View>
	);
}
