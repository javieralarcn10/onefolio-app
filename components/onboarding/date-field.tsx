import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import * as Localization from "expo-localization";

type DateFieldProps = {
	label: string;
	value: Date | null;
	onChange: (date: Date | null) => void;
	optional?: boolean;
};

export function DateField({
	label,
	value,
	onChange,
	optional = false,
}: DateFieldProps) {
	const locale = Localization.getLocales()[0]?.languageCode || "en-US";
	const [show, setShow] = useState(false);
	const [tempDate, setTempDate] = useState<Date>(value || new Date());

	const handleChange = (_: any, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShow(false);
			if (selectedDate) {
				onChange(selectedDate);
			}
		} else {
			// iOS: just update temp date, don't close yet
			if (selectedDate) {
				setTempDate(selectedDate);
			}
		}
	};

	const handleConfirm = () => {
		onChange(tempDate);
		setShow(false);
	};

	const handleCancel = () => {
		setTempDate(value || new Date());
		setShow(false);
	};

	const openPicker = () => {
		setTempDate(value || new Date());
		setShow(true);
		Keyboard.dismiss();
	};

	return (
		<View className="mb-7">
			<Text className="font-lausanne-regular text-foreground text-sm">
				{label} {optional && <Text className="text-muted-foreground">(optional)</Text>}
			</Text>
			<Pressable
				onPress={openPicker}
				className="border-b border-foreground py-2"
			>
				<Text
					className={`font-lausanne-light text-lg ${value ? "text-foreground" : "text-placeholder"}`}
				>
					{value ? value.toLocaleDateString() : "Select date"}
				</Text>
			</Pressable>

			{/* Android uses native dialog automatically */}
			{Platform.OS === "android" && show && (
				<DateTimePicker
					value={tempDate}
					mode="date"
					display="default"
					locale={locale}
					onChange={handleChange}
				/>
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
							<View className="pb-8 flex justify-center items-center">
								<DateTimePicker
									value={tempDate}
									mode="date"
									display="spinner"
									locale={locale}
									onChange={handleChange}
									style={{ height: 200, }}
								/>
							</View>
						</Pressable>
					</Pressable>
				</Modal>
			)}
		</View>
	);
}
