import { Colors } from "@/constants/colors";
import { Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type InputFieldProps = {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
	keyboardType?: "default" | "numeric" | "decimal-pad";
	error?: string;
	required?: boolean;
	optional?: boolean;
};

export function InputField({
	label,
	value,
	onChangeText,
	placeholder,
	keyboardType = "default",
	error,
	required = false,
	optional = false,
}: InputFieldProps) {
	return (
		<View className="mb-7">
			<Text className="font-lausanne-regular text-foreground text-sm mb-0">
				{label}
				{required && <Text className="text-red-700"> *</Text>}
				{optional && <Text className="text-muted-foreground"> (optional)</Text>}
			</Text>
			<TextInput
				autoCorrect={false}
				onChangeText={onChangeText}
				value={value}
				allowFontScaling={false}
				placeholder={placeholder}
				placeholderTextColor={Colors.placeholder}
				keyboardType={keyboardType}
				className={`border-b ${error ? "border-red-600" : "border-foreground"} text-foreground font-lausanne-light`}
				style={{ fontSize: 17, height: 40, textAlignVertical: "bottom" }}
			/>
			{error && (
				<Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
					<Text className="text-red-600 text-sm font-lausanne-regular mt-2">
						{error}
					</Text>
				</Animated.View>
			)}
		</View>
	);
}
