import { COUNTRIES } from "@/utils/countries";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";

type CountryFieldProps = {
	label: string;
	value: string;
	onChange: (country: string) => void;
};

export function CountryField({ label, value, onChange }: CountryFieldProps) {
	const [show, setShow] = useState(false);
	const [tempCountry, setTempCountry] = useState<string>(value || "");

	const handleConfirm = () => {
		onChange(tempCountry);
		setShow(false);
	};

	const handleCancel = () => {
		setTempCountry(value || "");
		setShow(false);
	};

	const openPicker = () => {
		setTempCountry(value || "");
		setShow(true);
		Keyboard.dismiss();
	};

	// Get the display name for the selected country
	const selectedCountryName =
		COUNTRIES.find((c) => c.name === value)?.name || "";

	return (
		<View className="mb-7">
			<Text className="font-lausanne-regular text-foreground text-sm">
				{label}
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

			{/* Android uses native dialog-style picker */}
			{Platform.OS === "android" && (
				<Modal
					visible={show}
					transparent
					animationType="fade"
					onRequestClose={handleCancel}
				>
					<Pressable
						className="flex-1 bg-black/60 justify-end"
						onPress={handleCancel}
					>
						<Pressable
							className="bg-background"
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
								<Pressable onPress={handleConfirm} className="w-1/3">
									<Text className="font-lausanne-medium text-foreground text-base self-end">
										Done
									</Text>
								</Pressable>
							</View>

							{/* Picker */}
							<View className="pb-8">
								<Picker
									selectedValue={tempCountry}
									onValueChange={(itemValue) => setTempCountry(itemValue)}
									style={{ height: 200 }}
								>
									<Picker.Item label="Select country" value="" />
									{COUNTRIES.map((country) => (
										<Picker.Item
											key={country.code}
											label={country.name}
											value={country.name}
										/>
									))}
								</Picker>
							</View>
						</Pressable>
					</Pressable>
				</Modal>
			)}

			{/* iOS uses custom modal */}
			{Platform.OS === "ios" && (
				<Modal
					visible={show}
					transparent
					animationType="fade"
					onRequestClose={handleCancel}
				>
					<Pressable
						className="flex-1 bg-black/60 justify-end"
						onPress={handleCancel}
					>
						<Pressable
							className="bg-background"
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
								<Pressable onPress={handleConfirm} className="w-1/3">
									<Text className="font-lausanne-medium text-foreground text-base self-end">
										Done
									</Text>
								</Pressable>
							</View>

							{/* Picker */}
							<View className="pb-8">
								<Picker
									selectedValue={tempCountry}
									onValueChange={(itemValue) => setTempCountry(itemValue)}
									itemStyle={{ height: 200 }}
								>
									<Picker.Item label="Select country" value="" />
									{COUNTRIES.map((country) => (
										<Picker.Item
											key={country.code}
											label={country.name}
											value={country.name}
										/>
									))}
								</Picker>
							</View>
						</Pressable>
					</Pressable>
				</Modal>
			)}
		</View>
	);
}
