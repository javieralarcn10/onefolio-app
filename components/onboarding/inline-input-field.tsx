import { Colors } from "@/constants/colors";
import { Text, TextInput, View } from "react-native";

type InlineInputFieldProps = {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
	keyboardType?: "default" | "numeric" | "decimal-pad";
};

export function InlineInputField({
	label,
	value,
	onChangeText,
	placeholder,
	keyboardType = "default",
}: InlineInputFieldProps) {
	return (
		<View className="flex-1">
			<Text className="font-lausanne-regular text-foreground text-sm">
				{label}
			</Text>
			<TextInput
				autoCorrect={false}
				onChangeText={onChangeText}
				value={value}
				allowFontScaling={false}
				placeholder={placeholder}
				placeholderTextColor={Colors.placeholder}
				keyboardType={keyboardType}
				className="border-b border-foreground text-foreground font-lausanne-light"
				style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
			/>
		</View>
	);
}
