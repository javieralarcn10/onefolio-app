import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

type ChipSelectorProps<T extends string> = {
	options: readonly { id: T; label: string }[];
	selected: T | null;
	onSelect: (id: T) => void;
};

export function ChipSelector<T extends string>({
	options,
	selected,
	onSelect,
}: ChipSelectorProps<T>) {
	return (
		<View className="flex-row flex-wrap gap-2">
			{options.map((option) => (
				<Pressable
					key={option.id}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onSelect(option.id);
					}}
					className={`px-4 py-2 border ${selected === option.id
						? "bg-foreground border-foreground"
						: "bg-background border-border"
						}`}
				>
					<Text
						className={`font-lausanne-regular text-sm ${selected === option.id ? "text-white" : "text-foreground"}`}
					>
						{option.label}
					</Text>
				</Pressable>
			))}
		</View>
	);
}
