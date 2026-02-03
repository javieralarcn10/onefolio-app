import { Pressable, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { OnboardingOption } from "@/types/custom";
import { memo, useCallback } from "react";
import Animated, { ZoomIn, ZoomOut, } from "react-native-reanimated";
import Icon from "react-native-remix-icon";

export const Option = memo(
	({ option, selected, onPress }: { option: OnboardingOption; selected: boolean; onPress: (option: OnboardingOption) => void }) => {
		const handlePress = useCallback(() => {
			onPress(option);
		}, [option, onPress]);

		return (
			<Pressable onPress={handlePress}>
				<View
					className={`flex-row items-center justify-between ${selected ? "bg-accent" : ""} py-[16] px-5`}>
					<View className="flex-row items-center gap-2 max-w-[89%]">
						{option.icon && <option.icon color={Colors.foreground} weight="duotone" size={20} />}
						<Text className="text-foreground text-lg font-lausanne-light">{option.title}</Text>
					</View>
					{selected && (
						<Animated.View entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(150)}>
							<Icon name="check-line" size="22" color={Colors.foreground} fallback={null} />
						</Animated.View>
					)}
				</View>
			</Pressable>
		);
	},
);
