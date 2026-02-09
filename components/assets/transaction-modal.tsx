import { Colors } from "@/constants/colors";
import { DateField } from "@/components/onboarding/date-field";
import { InputField } from "@/components/onboarding/input-field";
import { Asset, Transaction, TransactionType } from "@/types/custom";
import { generateTransactionId, getNetQuantity, getNetAmount, isIndivisibleAsset, isQuantityBased } from "./asset-detail-helpers";
import React, { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import Icon from "react-native-remix-icon";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

type Props = {
	visible: boolean;
	asset: Asset;
	initialType: TransactionType;
	onClose: () => void;
	onConfirm: (transaction: Transaction) => void;
	isProcessing: boolean;
};

export function TransactionModal({ visible, asset, initialType, onClose, onConfirm, isProcessing }: Props) {
	const txType = initialType;
	const [quantityText, setQuantityText] = useState("");
	const [pricePerUnitText, setPricePerUnitText] = useState("");
	const [amountText, setAmountText] = useState("");
	const [transactionDate, setTransactionDate] = useState<Date | null>(new Date());

	// Indivisible assets (physical metals, real estate) are treated as amount-based
	const indivisible = isIndivisibleAsset(asset);
	const quantityBased = isQuantityBased(asset.type) && !indivisible;

	// Parse values
	const quantity = parseFloat(quantityText.replace(",", "."));
	const pricePerUnit = parseFloat(pricePerUnitText.replace(",", "."));
	const amount = parseFloat(amountText.replace(",", "."));

	// Validation
	const isValidQuantity = !isNaN(quantity) && quantity > 0;
	const isValidPrice = !isNaN(pricePerUnit) && pricePerUnit > 0;
	const isValidAmount = !isNaN(amount) && amount > 0;
	const isValidDate = !!transactionDate;

	const isValid = quantityBased
		? isValidQuantity && isValidPrice && isValidDate
		: isValidAmount && isValidDate;

	// For sell validation: quantity-based assets have a quantity cap,
	// and divisible amount-based assets (cash) have an amount cap.
	const maxSellQuantity = getNetQuantity(asset);
	const maxSellAmount = getNetAmount(asset);

	const exceedsPosition = txType === "sell" && quantityBased
		&& isValidQuantity && quantity > maxSellQuantity;
	const quantityError = exceedsPosition
		? "Quantity exceeds your current position."
		: undefined;

	// Amount-based sell validation (cash and similar divisible assets)
	const exceedsBalance = txType === "sell" && !quantityBased && !indivisible
		&& isValidAmount && amount > maxSellAmount;
	const amountError = exceedsBalance
		? "Amount exceeds your current balance."
		: undefined;

	const handleConfirm = () => {
		if (!isValid || exceedsPosition || exceedsBalance) return;

		const transaction: Transaction = {
			id: generateTransactionId(),
			type: txType,
			date: (transactionDate || new Date()).toISOString(),
			amount: quantityBased ? quantity * pricePerUnit : amount,
			...(quantityBased && { quantity, pricePerUnit }),
		};

		onConfirm(transaction);
	};

	const handleClose = () => {
		// Reset form
		setQuantityText("");
		setPricePerUnitText("");
		setAmountText("");
		setTransactionDate(new Date());
		onClose();
	};

	// Calculate total for display in button
	const totalAmount = quantityBased && isValidQuantity && isValidPrice
		? quantity * pricePerUnit
		: isValidAmount
			? amount
			: null;

	const MIN_DATE = new Date(1900, 0, 1);
	const MAX_DATE = new Date();

	return (
		<Modal
			visible={visible}
			animationType="none"
			transparent
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				{/* Backdrop — fades in/out independently */}
				<Animated.View
					entering={FadeIn.duration(250)}
					exiting={FadeOut.duration(200)}
					className="absolute inset-0"
				>
					<Pressable onPress={handleClose} className="flex-1 bg-black/50" />
				</Animated.View>

				{/* Spacer to push sheet to bottom */}
				<View className="flex-1" pointerEvents="box-none" />

				{/* Bottom sheet — slides up/down */}
				<Animated.View
					entering={SlideInDown.duration(350).damping(20)}
					exiting={SlideOutDown.duration(250)}
					className="bg-background max-h-[85%]"
				>
					<ScrollView
						keyboardShouldPersistTaps="handled"
						contentContainerClassName="px-5 pt-6 pb-safe-offset-6"
					>
						{/* Header */}
						<View className="flex-row items-center justify-between mb-6">
							<Text className="text-foreground text-lg font-lausanne-medium">
								{txType === "buy" ? "Record Purchase" : "Record Sale"}
							</Text>
							<Pressable
								onPress={handleClose}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Icon name="close-line" size="24" color={Colors.foreground} fallback={null} />
							</Pressable>
						</View>

						{/* Quantity-based inputs */}
						{quantityBased ? (
							<>
								<InputField
									label="Quantity"
									value={quantityText}
									onChangeText={setQuantityText}
									placeholder="0"
									keyboardType="decimal-pad"
									required
									error={quantityError}
								/>

								<InputField
									label={`Price per Unit (${asset.currency})`}
									value={pricePerUnitText}
									onChangeText={setPricePerUnitText}
									placeholder="0.00"
									keyboardType="decimal-pad"
									required
								/>
							</>
						) : (
						<InputField
							label={`Amount (${asset.currency})`}
							value={amountText}
							onChangeText={setAmountText}
							placeholder="0.00"
							keyboardType="decimal-pad"
							required
							error={amountError}
						/>
						)}

						<DateField
							label="Date"
							value={transactionDate}
							onChange={setTransactionDate}
							minimumDate={MIN_DATE}
							maximumDate={MAX_DATE}
						/>

						<Pressable
							onPress={handleConfirm}
						disabled={!isValid || isProcessing || exceedsPosition || exceedsBalance}
						className={`flex-row items-center justify-center gap-2 py-4 bg-foreground border border-foreground ${isValid && !exceedsPosition && !exceedsBalance ? "" : "opacity-50"
							}`}
						>
							<Text className="text-background font-lausanne-regular text-lg">
								{txType === "buy" ? "Confirm Purchase" : "Confirm Sale"}
								{totalAmount !== null && (
									<>
										{" · "}
										{totalAmount.toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}{" "}
										{asset.currency}
									</>
								)}
							</Text>
							<Icon name="check-line" size="20" color={Colors.accent} fallback={null} />
						</Pressable>
					</ScrollView>
				</Animated.View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
