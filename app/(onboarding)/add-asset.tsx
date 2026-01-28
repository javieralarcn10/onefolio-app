import { AssetSearch } from "@/components/onboarding/asset-search";
import { ChipSelector } from "@/components/onboarding/chip-selector";
import { CountryField } from "@/components/onboarding/country-field";
import { CurrencySelector } from "@/components/onboarding/currency-selector";
import { DateField } from "@/components/onboarding/date-field";
import { InlineInputField } from "@/components/onboarding/inline-input-field";
import { InputField } from "@/components/onboarding/input-field";
import { SectionLabel } from "@/components/onboarding/section-label";
import {
	INVESTMENT_TYPES,
	METAL_FORMATS,
	METAL_TYPES,
	PROPERTY_TYPES,
	QUANTITY_UNITS,
} from "@/constants/asset-options";
import { Colors } from "@/constants/colors";
import {
	Asset,
	BondAsset,
	CashAsset,
	CryptoAsset,
	DepositAsset,
	PreciousMetalAsset,
	PrivateInvestmentAsset,
	RealEstateAsset,
	StockAsset,
} from "@/types/custom";
import { useOnboarding } from "@/utils/onboarding-context";
import { generateAssetId } from "@/utils/storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { XIcon } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ASSETS_OPTIONS } from "./step-5";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

export default function AddInvestment() {
	const { type } = useLocalSearchParams<{ type: string }>();
	const assetTypeId = Number(type);
	const assetOption = ASSETS_OPTIONS.find((option) => option.id === assetTypeId);
	const assetType = assetOption?.assetType;

	const { addPendingAsset } = useOnboarding();

	// Common fields
	const [name, setName] = useState("");
	const [currency, setCurrency] = useState("USD");
	const [isSaving, setIsSaving] = useState(false);

	// Stocks & ETFs (now with search)
	const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
	const [selectedStockName, setSelectedStockName] = useState<string | null>(null);
	const [quantity, setQuantity] = useState("");
	const [purchasePrice, setPurchasePrice] = useState("");
	const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);

	// Bonds
	const [amount, setAmount] = useState("");
	const [interestRate, setInterestRate] = useState("");
	const [maturityDate, setMaturityDate] = useState<Date | null>(null);

	// Deposits
	const [bankName, setBankName] = useState("");

	// Precious Metals
	const [metalType, setMetalType] = useState<"gold" | "silver" | "platinum" | "palladium" | "other" | null>(null);
	const [metalFormat, setMetalFormat] = useState<"physical" | "etf" | null>(null);
	const [quantityUnit, setQuantityUnit] = useState<"oz" | "g" | null>(null);

	// Real Estate
	const [propertyType, setPropertyType] = useState<"residential" | "commercial" | "land" | "reit" | "crowdfunding" | "other" | null>(null);
	const [estimatedValue, setEstimatedValue] = useState("");
	const [country, setCountry] = useState("");
	const [city, setCity] = useState("");
	const [zip, setZip] = useState("");

	// Private Investments
	const [investmentType, setInvestmentType] = useState<"loan" | "crowdlending" | "equity" | "other" | null>(null);
	const [expectedReturn, setExpectedReturn] = useState("");

	// Cash
	const [accountName, setAccountName] = useState("");

	// Crypto (now with search)
	const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null);
	const [selectedCryptoName, setSelectedCryptoName] = useState<string | null>(null);

	// Button animation
	const buttonScale = useSharedValue(1);

	const buttonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScale.value }],
	}));

	const handlePressIn = () => {
		buttonScale.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handlePressOut = () => {
		buttonScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	// Check if form is valid (all required fields filled)
	const isFormValid = useMemo(() => {
		// Type-specific validation
		switch (assetType) {
			case "stocks_etfs":
				return (
					selectedStockTicker !== null &&
					selectedStockName !== null &&
					quantity !== "" && parseFloat(quantity) > 0 &&
					purchasePrice !== "" && parseFloat(purchasePrice) > 0
				);

			case "bonds":
				return (
					name.trim() !== "" &&
					amount !== "" && parseFloat(amount) > 0 &&
					maturityDate !== null
				);

			case "deposits":
				return (
					name.trim() !== "" &&
					bankName.trim() !== "" &&
					amount !== "" && parseFloat(amount) > 0
				);

			case "precious_metals":
				if (metalFormat === "physical") {
					return (
						name.trim() !== "" &&
						metalType !== null &&
						metalFormat !== null &&
						quantity !== "" && parseFloat(quantity) > 0 &&
						quantityUnit !== null
					);
				}
				return (
					name.trim() !== "" &&
					metalType !== null &&
					metalFormat !== null &&
					quantity !== "" && parseFloat(quantity) > 0
				);

			case "real_estate":
				return (
					name.trim() !== "" &&
					propertyType !== null &&
					estimatedValue !== "" && parseFloat(estimatedValue) > 0 &&
					country.trim() !== "" &&
					city.trim() !== "" &&
					zip.trim() !== ""
				);

			case "private_investments":
				return (
					name.trim() !== "" &&
					investmentType !== null &&
					amount !== "" && parseFloat(amount) > 0
				);

			case "cash":
				return (
					name.trim() !== "" &&
					accountName.trim() !== "" &&
					amount !== "" && parseFloat(amount) > 0
				);

			case "crypto":
				return (
					selectedCryptoSymbol !== null &&
					selectedCryptoName !== null &&
					quantity !== "" && parseFloat(quantity) > 0
				);

			default:
				return false;
		}
	}, [
		assetType, selectedStockTicker, selectedStockName, quantity, purchasePrice,
		name, amount, maturityDate, bankName, metalType, metalFormat, quantityUnit,
		propertyType, estimatedValue, country, city, zip, investmentType, accountName,
		selectedCryptoSymbol, selectedCryptoName
	]);

	const handleSave = async () => {
		if (!isFormValid) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			return;
		}

		setIsSaving(true);

		try {
			const now = new Date().toISOString();

			let asset: Asset;

			switch (assetType) {
				case "stocks_etfs":
					asset = {
						id: generateAssetId(),
						name: selectedStockName!,
						currency,
						createdAt: now,
						updatedAt: now,
						type: "stocks_etfs",
						ticker: selectedStockTicker!,
						quantity: parseFloat(quantity),
						purchasePrice: parseFloat(purchasePrice),
						purchaseDate: purchaseDate?.toISOString() || now,
					} as StockAsset;
					break;

				case "bonds":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "bonds",
						amount: parseFloat(amount),
						interestRate: interestRate ? parseFloat(interestRate) : 0,
						purchaseDate: purchaseDate?.toISOString() || now,
						maturityDate: maturityDate?.toISOString() || "",
					} as BondAsset;
					break;

				case "deposits":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "deposits",
						bankName: bankName.trim(),
						amount: parseFloat(amount),
						interestRate: interestRate ? parseFloat(interestRate) : 0,
						maturityDate: maturityDate?.toISOString(),
					} as DepositAsset;
					break;

				case "precious_metals":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "precious_metals",
						metalType: metalType!,
						format: metalFormat!,
						quantity: parseFloat(quantity),
						quantityUnit: metalFormat === "physical" ? quantityUnit! : undefined,
						purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
					} as PreciousMetalAsset;
					break;

				case "real_estate":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "real_estate",
						propertyType: propertyType!,
						estimatedValue: parseFloat(estimatedValue),
						country: country.trim(),
						city: city.trim(),
						zip: zip.trim(),
					} as RealEstateAsset;
					break;

				case "private_investments":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "private_investments",
						investmentType: investmentType!,
						amount: parseFloat(amount),
						expectedReturn: expectedReturn ? parseFloat(expectedReturn) : undefined,
						maturityDate: maturityDate?.toISOString(),
					} as PrivateInvestmentAsset;
					break;

				case "cash":
					asset = {
						id: generateAssetId(),
						name: name.trim(),
						currency,
						createdAt: now,
						updatedAt: now,
						type: "cash",
						accountName: accountName.trim(),
						amount: parseFloat(amount),
					} as CashAsset;
					break;

				case "crypto":
					asset = {
						id: generateAssetId(),
						name: selectedCryptoName!,
						currency,
						createdAt: now,
						updatedAt: now,
						type: "crypto",
						symbol: selectedCryptoSymbol!,
						quantity: parseFloat(quantity),
						purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
					} as CryptoAsset;
					break;

				default:
					throw new Error("Unknown asset type");
			}

			// Add to pending assets in context (not to storage)
			addPendingAsset(asset);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.back();
		} catch (error) {
			console.error("Error saving asset:", error);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		} finally {
			setIsSaving(false);
		}
	};

	const renderStocksForm = () => (
		<>
			<AssetSearch
				type="stock"
				selectedSymbol={selectedStockTicker}
				selectedName={selectedStockName}
				onSelect={(ticker, stockName) => {
					setSelectedStockTicker(ticker);
					setSelectedStockName(stockName);
				}}
				onClear={() => {
					setSelectedStockTicker(null);
					setSelectedStockName(null);
				}}
			/>
			<InputField
				label="Quantity"
				value={quantity}
				onChangeText={setQuantity}
				placeholder="e.g., 10"
				keyboardType="decimal-pad"
			/>
			<InputField
				label="Purchase Price (per share)"
				value={purchasePrice}
				onChangeText={setPurchasePrice}
				placeholder="e.g., 150.00"
				keyboardType="decimal-pad"
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderBondsForm = () => (
		<>
			<InputField
				label="Bond Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., US Treasury 10Y"
			/>
			<InputField
				label="Amount Invested"
				value={amount}
				onChangeText={setAmount}
				placeholder="e.g., 10000"
				keyboardType="decimal-pad"
			/>
			<InputField
				label="Interest Rate (%)"
				value={interestRate}
				onChangeText={setInterestRate}
				placeholder="e.g., 4.5"
				keyboardType="decimal-pad"
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderDepositsForm = () => (
		<>
			<InputField
				label="Deposit Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., High-Yield Savings"
			/>
			<InputField
				label="Bank Name"
				value={bankName}
				onChangeText={setBankName}
				placeholder="e.g., Chase, BBVA"
			/>
			<InputField
				label="Amount"
				value={amount}
				onChangeText={setAmount}
				placeholder="e.g., 5000"
				keyboardType="decimal-pad"
			/>
			<InputField
				label="Interest Rate (%) - Annual"
				value={interestRate}
				onChangeText={setInterestRate}
				placeholder="e.g., 3.5"
				keyboardType="decimal-pad"
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
				optional
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderPreciousMetalsForm = () => (
		<>
			<InputField
				label="Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., Gold Coins, Silver ETF"
			/>
			<View className="mb-7">
				<SectionLabel>Metal Type</SectionLabel>
				<ChipSelector
					options={METAL_TYPES}
					selected={metalType}
					onSelect={setMetalType}
				/>
			</View>
			<View className="mb-7 flex flex-row items-start justify-between gap-2">
				<View>
					<SectionLabel>Format</SectionLabel>
					<ChipSelector
						options={METAL_FORMATS}
						selected={metalFormat}
						onSelect={(format) => {
							setMetalFormat(format);
							// Reset physical-specific fields when switching to ETF
							if (format === "etf") {
								setQuantityUnit(null);
							}
						}}
					/>
				</View>
				{/* Show quantity unit selector only for physical */}
				{metalFormat === "physical" && (
					<View>
						<SectionLabel>Quantity Unit</SectionLabel>
						<ChipSelector
							options={QUANTITY_UNITS}
							selected={quantityUnit}
							onSelect={setQuantityUnit}
						/>
					</View>
				)}
			</View>

			<InputField
				label={
					metalFormat === "physical"
						? `Quantity${quantityUnit ? ` (${quantityUnit})` : ""}`
						: "Quantity (units)"
				}
				value={quantity}
				onChangeText={setQuantity}
				placeholder="e.g., 10"
				keyboardType="decimal-pad"
			/>

			{/* Only show purchase price for ETF - physical value is calculated from spot price */}
			{metalFormat === "etf" && (
				<InputField
					label="Purchase Price (per unit)"
					value={purchasePrice}
					onChangeText={setPurchasePrice}
					placeholder="e.g., 180.00"
					keyboardType="decimal-pad"
				/>
			)}

			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderRealEstateForm = () => (
		<>
			<InputField
				label="Property Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., Downtown Apartment"
			/>
			<View className="mb-7">
				<SectionLabel>Property Type</SectionLabel>
				<ChipSelector
					options={PROPERTY_TYPES}
					selected={propertyType}
					onSelect={setPropertyType}
				/>
			</View>
			<InputField
				label="Purchase Price"
				value={estimatedValue}
				onChangeText={setEstimatedValue}
				placeholder="e.g., 250000"
				keyboardType="decimal-pad"
			/>
			<CountryField
				label="Country"
				value={country}
				onChange={setCountry}
			/>
			{/* City and Zip in a row */}
			<View className="flex-row gap-4 mb-7">
				<InlineInputField
					label="City"
					value={city}
					onChangeText={setCity}
					placeholder="e.g., Madrid"
				/>
				<InlineInputField
					label="Zip"
					value={zip}
					onChangeText={setZip}
					placeholder="e.g., 28001"
				/>
			</View>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderPrivateInvestmentsForm = () => (
		<>
			<InputField
				label="Investment Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., Startup XYZ"
			/>
			<View className="mb-7">
				<SectionLabel>Investment Type</SectionLabel>
				<ChipSelector
					options={INVESTMENT_TYPES}
					selected={investmentType}
					onSelect={setInvestmentType}
				/>
			</View>
			<InputField
				label="Amount Invested"
				value={amount}
				onChangeText={setAmount}
				placeholder="e.g., 5000"
				keyboardType="decimal-pad"
			/>
			<InputField
				label="Expected Return (%)"
				value={expectedReturn}
				onChangeText={setExpectedReturn}
				placeholder="e.g., 12"
				keyboardType="decimal-pad"
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
				optional
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderCashForm = () => (
		<>
			<InputField
				label="Name"
				value={name}
				onChangeText={setName}
				placeholder="e.g., Emergency Fund"
			/>
			<InputField
				label="Account / Location"
				value={accountName}
				onChangeText={setAccountName}
				placeholder="e.g., Chase Checking"
			/>
			<InputField
				label="Amount"
				value={amount}
				onChangeText={setAmount}
				placeholder="e.g., 10000"
				keyboardType="decimal-pad"
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderCryptoForm = () => (
		<>
			<AssetSearch
				type="crypto"
				selectedSymbol={selectedCryptoSymbol}
				selectedName={selectedCryptoName}
				onSelect={(symbol, cryptoName) => {
					setSelectedCryptoSymbol(symbol);
					setSelectedCryptoName(cryptoName);
				}}
				onClear={() => {
					setSelectedCryptoSymbol(null);
					setSelectedCryptoName(null);
				}}
			/>
			<InputField
				label="Quantity"
				value={quantity}
				onChangeText={setQuantity}
				placeholder="e.g., 0.5"
				keyboardType="decimal-pad"
			/>
			<InputField
				label="Purchase Price (per unit)"
				value={purchasePrice}
				onChangeText={setPurchasePrice}
				placeholder="e.g., 45000"
				keyboardType="decimal-pad"
			/>
			<View className="mb-7">
				<SectionLabel>Currency</SectionLabel>
				<CurrencySelector selected={currency} onSelect={setCurrency} />
			</View>
		</>
	);

	const renderForm = () => {
		switch (assetType) {
			case "stocks_etfs":
				return renderStocksForm();
			case "bonds":
				return renderBondsForm();
			case "deposits":
				return renderDepositsForm();
			case "precious_metals":
				return renderPreciousMetalsForm();
			case "real_estate":
				return renderRealEstateForm();
			case "private_investments":
				return renderPrivateInvestmentsForm();
			case "cash":
				return renderCashForm();
			case "crypto":
				return renderCryptoForm();
			default:
				return null;
		}
	};

	const isButtonDisabled = !isFormValid || isSaving;

	return (
		<View className="flex-1 mb-safe">
			{/* Header */}
			<View className="px-5 pt-6 pb-5 flex-row items-center justify-between bg-foreground">
				<View className="flex-1">
					<Text className="text-xl font-lausanne-regular text-background">
						{assetOption?.title}
					</Text>
				</View>
				<Pressable className="p-2" onPress={() => router.back()}>
					<XIcon color={Colors.background} size={24} />
				</Pressable>
			</View>

			{/* Form */}
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				bottomOffset={40}
				showsVerticalScrollIndicator={false}
				contentContainerClassName="flex-grow px-5 pt-6 pb-10"
			>
				{renderForm()}
			</KeyboardAwareScrollView>

			{/* Save Button */}
			<View className="px-5 pb-5 pt-4">
				<Animated.View style={[buttonAnimatedStyle]}>
					<Pressable
						disabled={isButtonDisabled}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onPress={handleSave}
						className={`bg-foreground flex-row items-center justify-center gap-3 py-4 border border-foreground ${isButtonDisabled ? "opacity-50" : ""}`}
					>
						{isSaving ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
						) : (
							<Text className="text-white font-lausanne-light text-xl">
								Add Asset
							</Text>
						)}
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}
