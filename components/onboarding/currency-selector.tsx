import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "MXN", "BRL"];

type CurrencySelectorProps = {
	selected: string;
	onSelect: (currency: string) => void;
};

export function CurrencySelector({ selected, onSelect }: CurrencySelectorProps) {
	return (
		<View className="flex-row flex-wrap gap-2">
			{CURRENCIES.map((currency) => (
				<Pressable
					key={currency}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onSelect(currency);
					}}
					className={`px-3 py-2 border ${selected === currency
						? "bg-foreground border-foreground"
						: "bg-background border-border"
						}`}
				>
					<Text
						className={`font-lausanne-regular text-sm ${selected === currency ? "text-white" : "text-foreground"}`}
					>
						{currency}
					</Text>
				</Pressable>
			))}
		</View>
	);
}
