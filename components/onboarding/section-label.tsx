import { Text } from "react-native";

type SectionLabelProps = {
	children: string;
};

export function SectionLabel({ children }: SectionLabelProps) {
	return (
		<Text className="font-lausanne-regular text-foreground text-sm mb-1">
			{children}
		</Text>
	);
}
