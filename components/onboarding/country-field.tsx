import { COUNTRIES } from "@/utils/countries";
import { useCallback, useMemo, useState } from "react";
import {
	FlatList,
	Keyboard,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";

type CountryFieldProps = {
	label: string;
	value: string;
	onChange: (country: string) => void;
	required?: boolean;
};

export function CountryField({ label, value, onChange, required = false }: CountryFieldProps) {
	const [show, setShow] = useState(false);
	const [search, setSearch] = useState("");

	const handleSelect = (countryName: string) => {
		onChange(countryName);
		setShow(false);
		setSearch("");
	};

	const handleCancel = () => {
		setShow(false);
		setSearch("");
	};

	const openPicker = () => {
		setShow(true);
		setSearch("");
		Keyboard.dismiss();
	};

	const filteredCountries = useMemo(() => {
		if (!search.trim()) return COUNTRIES;
		const lowerSearch = search.toLowerCase();
		return COUNTRIES.filter((country) =>
			country.name.toLowerCase().includes(lowerSearch)
		);
	}, [search]);

	const renderItem = useCallback(
		({ item }: { item: (typeof COUNTRIES)[number] }) => (
			<Pressable
				onPress={() => handleSelect(item.name)}
				className={`px-5 py-3.5 border-b border-border ${item.name === value ? "bg-foreground/5" : ""}`}
			>
				<Text
					className={`font-lausanne-regular text-base ${item.name === value ? "text-foreground font-lausanne-medium" : "text-foreground"}`}
				>
					{item.name}
				</Text>
			</Pressable>
		),
		[value]
	);

	const keyExtractor = useCallback(
		(item: (typeof COUNTRIES)[number]) => item.code,
		[]
	);

	// Get the display name for the selected country
	const selectedCountryName =
		COUNTRIES.find((c) => c.name === value)?.name || "";

	return (
		<View className="mb-7">
			<Text className="font-lausanne-regular text-foreground text-sm">
				{label}{required && <Text className="text-red-700"> *</Text>}
			</Text>
			<Pressable
				onPress={openPicker}
				className="border-b border-foreground py-2"
			>
				<Text
					className={`font-lausanne-light text-lg ${value ? "text-foreground" : "text-placeholder"}`}
				>
					{selectedCountryName || "Select country"}
				</Text>
			</Pressable>

			<Modal
				visible={show}
				transparent
				animationType="slide"
				onRequestClose={handleCancel}
			>
				<Pressable
					className="flex-1 bg-black/60 justify-end"
					onPress={handleCancel}
				>
					<Pressable
						className={`bg-background ${Platform.OS === "ios" ? "pb-safe-offset-2" : ""}`}
						style={{ maxHeight: "75%" }}
						onPress={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<View className="flex-row justify-between items-center px-5 py-4 border-b border-border">
							<Pressable onPress={handleCancel} className="w-1/3">
								<Text className="font-lausanne-regular text-foreground text-base">
									Cancel
								</Text>
							</Pressable>
							<Text className="font-lausanne-medium text-foreground text-base text-center">
								{label}
							</Text>
							<View className="w-1/3" />
						</View>

						{/* Country List */}
						<FlatList
							data={filteredCountries}
							renderItem={renderItem}
							keyExtractor={keyExtractor}
							keyboardShouldPersistTaps="handled"
							initialNumToRender={20}
							maxToRenderPerBatch={30}
							windowSize={10}
							getItemLayout={(_, index) => ({
								length: 52,
								offset: 52 * index,
								index,
							})}
						/>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	);
}
