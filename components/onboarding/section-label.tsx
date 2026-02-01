import { Text } from "react-native";

type SectionLabelProps = {
	children: string;
	required?: boolean;
};

export function SectionLabel({ children, required = false }: SectionLabelProps) {
	return (
		<Text className="font-lausanne-regular text-foreground text-sm mb-1">
			{children}{required && <Text className="text-red-700"> *</Text>}
		</Text>
	);
}
