import { AssetSearch } from "@/components/onboarding/asset-search";
import { ChipSelector } from "@/components/onboarding/chip-selector";
import { CountryField } from "@/components/onboarding/country-field";
import { CurrencySelector } from "@/components/onboarding/currency-selector";
import { DateField } from "@/components/onboarding/date-field";
import { InlineInputField } from "@/components/onboarding/inline-input-field";
import { InputField } from "@/components/onboarding/input-field";
import { SectionLabel } from "@/components/onboarding/section-label";
import {
	BOND_TYPES,
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
import Icon from "react-native-remix-icon";
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
	const [tickerType, setTickerType] = useState<string | null>(null);
	const [sector, setSector] = useState<string | undefined>(undefined);
	const [industry, setIndustry] = useState<string | undefined>(undefined);
	const [stockCountry, setStockCountry] = useState<string | undefined>(undefined);
	const [exchange, setExchange] = useState<string | undefined>(undefined);
	const [isSaving, setIsSaving] = useState(false);

	// Stocks & ETFs (now with search)
	const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
	const [selectedStockName, setSelectedStockName] = useState<string | null>(null);
	const [quantity, setQuantity] = useState("");
	const [purchasePrice, setPurchasePrice] = useState("");
	const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);

	// Bonds
	const [bondType, setBondType] = useState<"government" | "corporate" | null>(null);
	const [bondCountry, setBondCountry] = useState("");
	const [amount, setAmount] = useState("");
	const [interestRate, setInterestRate] = useState("");
	const [maturityDate, setMaturityDate] = useState<Date | null>(null);

	// Deposits
	const [bankName, setBankName] = useState("");

	// Precious Metals
	const [metalType, setMetalType] = useState<"gold" | "silver" | "platinum" | "palladium" | null>(null);
	const [metalFormat, setMetalFormat] = useState<"physical" | "etf" | null>(null);
	const [quantityUnit, setQuantityUnit] = useState<"oz" | "g" | null>(null);
	const [totalPrice, setTotalPrice] = useState("");

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

	// Field errors
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Minimum date for purchase dates (reasonable historical limit - 1900)
	const MIN_DATE = new Date(1900, 0, 1);
	// Maximum date is today
	const MAX_DATE = new Date();

	// Validation helper for numeric fields
	const isValidNumber = (value: string): boolean => {
		if (!value.trim()) return false;
		// Remove commas used as thousand separators
		const normalized = value.replace(/,/g, ".");
		// Check if it's a valid positive number
		const num = parseFloat(normalized);
		return !isNaN(num) && num > 0;
	};

	// Get numeric error message
	const getNumericError = (value: string, fieldName: string): string | undefined => {
		if (!value.trim()) return undefined; // Empty is not an error (required validation handles this)
		if (!isValidNumber(value)) {
			return `Please enter a valid ${fieldName}`;
		}
		return undefined;
	};

	// Validate a field and update errors
	const validateField = (field: string, value: string, fieldLabel: string) => {
		const error = getNumericError(value, fieldLabel);
		setErrors(prev => {
			if (error) {
				return { ...prev, [field]: error };
			}
			const { [field]: _, ...rest } = prev;
			return rest;
		});
	};

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

	// Check if form is valid (all required fields filled and no errors)
	const isFormValid = useMemo(() => {
		// Check if there are any validation errors
		if (Object.keys(errors).length > 0) return false;

		// Type-specific validation
		switch (assetType) {
			case "stocks_etfs":
				return (
					selectedStockTicker !== null &&
					selectedStockName !== null &&
					quantity !== "" && isValidNumber(quantity) &&
					purchasePrice !== "" && isValidNumber(purchasePrice)
				);

			case "bonds":
				return (
					name.trim() !== "" &&
					bondType !== null &&
					(bondType !== "government" || bondCountry.trim() !== "") &&
					amount !== "" && isValidNumber(amount) &&
					maturityDate !== null
				);

			case "deposits":
				return (
					name.trim() !== "" &&
					bankName.trim() !== "" &&
					amount !== "" && isValidNumber(amount)
				);

		case "precious_metals":
			if (metalFormat === "physical") {
				return (
					name.trim() !== "" &&
					metalType !== null &&
					metalFormat !== null &&
					quantity !== "" && isValidNumber(quantity) &&
					quantityUnit !== null &&
					totalPrice !== "" && isValidNumber(totalPrice)
				);
			}
			// ETF requires purchase price for profitability calculation
			return (
				name.trim() !== "" &&
				metalType !== null &&
				metalFormat !== null &&
				quantity !== "" && isValidNumber(quantity) &&
				purchasePrice !== "" && isValidNumber(purchasePrice)
			);

			case "real_estate":
				return (
					name.trim() !== "" &&
					propertyType !== null &&
					estimatedValue !== "" && isValidNumber(estimatedValue) &&
					country.trim() !== "" &&
					city.trim() !== "" &&
					zip.trim() !== ""
				);

			case "private_investments":
				return (
					name.trim() !== "" &&
					investmentType !== null &&
					amount !== "" && isValidNumber(amount)
				);

			case "cash":
				return (
					name.trim() !== "" &&
					accountName.trim() !== "" &&
					amount !== "" && isValidNumber(amount)
				);

			case "crypto":
				return (
					selectedCryptoSymbol !== null &&
					selectedCryptoName !== null &&
					quantity !== "" && isValidNumber(quantity) &&
					purchasePrice !== "" && isValidNumber(purchasePrice)
				);

			default:
				return false;
		}
	}, [
		assetType, selectedStockTicker, selectedStockName, quantity, purchasePrice, totalPrice,
		name, amount, maturityDate, bondType, bondCountry, bankName, metalType, metalFormat, quantityUnit,
		propertyType, estimatedValue, country, city, zip, investmentType, accountName,
		selectedCryptoSymbol, selectedCryptoName, errors
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
						tickerType: tickerType!,
						sector: sector,
						industry: industry,
						country: stockCountry,
						exchange: exchange,
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
						bondType: bondType!,
						bondCountry: bondType === "government" ? bondCountry.trim() : undefined,
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
						purchaseDate: purchaseDate?.toISOString(),
						maturityDate: maturityDate?.toISOString(),
					} as DepositAsset;
					break;

			case "precious_metals": {
				const qty = parseFloat(quantity);
				const pricePerUnit = metalFormat === "physical"
					? parseFloat(totalPrice) / qty
					: parseFloat(purchasePrice);
				asset = {
					id: generateAssetId(),
					name: name.trim(),
					currency,
					createdAt: now,
					updatedAt: now,
					type: "precious_metals",
					metalType: metalType!,
					format: metalFormat!,
					quantity: qty,
					quantityUnit: metalFormat === "physical" ? quantityUnit! : undefined,
					purchasePrice: pricePerUnit || 0,
				} as PreciousMetalAsset;
				break;
			}

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
						purchaseDate: purchaseDate?.toISOString(),
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
						purchaseDate: purchaseDate?.toISOString(),
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
				onSelect={(ticker, stockName, tickerType, sector, industry, country, exchange) => {
					setSelectedStockTicker(ticker);
					setSelectedStockName(stockName);
					setTickerType(tickerType);
					setSector(sector);
					setIndustry(industry);
					setStockCountry(country);
					setExchange(exchange);
				}}
				onClear={() => {
					setSelectedStockTicker(null);
					setSelectedStockName(null);
					setTickerType(null);
					setSector(undefined);
					setIndustry(undefined);
					setStockCountry(undefined);
					setExchange(undefined);
				}}
			/>
			<InputField
				label="Quantity"
				value={quantity}
				onChangeText={(text) => {
					setQuantity(text);
					validateField("quantity", text, "quantity");
				}}
				placeholder="e.g., 10"
				keyboardType="decimal-pad"
				required
				error={errors.quantity}
			/>
			<InputField
				label="Purchase Price (per share)"
				value={purchasePrice}
				onChangeText={(text) => {
					setPurchasePrice(text);
					validateField("purchasePrice", text, "price");
				}}
				placeholder="e.g., 150.00"
				keyboardType="decimal-pad"
				required
				error={errors.purchasePrice}
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
				minimumDate={MIN_DATE}
				maximumDate={MAX_DATE}
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
				required
			/>
			<View className="mb-7">
				<SectionLabel required>Bond Type</SectionLabel>
				<ChipSelector
					options={BOND_TYPES}
					selected={bondType}
					onSelect={(type) => {
						setBondType(type as "government" | "corporate" | null);
						// Clear country when switching away from government
						if (type !== "government") {
							setBondCountry("");
						}
					}}
				/>
			</View>
			{bondType === "government" && (
				<CountryField
					label="Country"
					value={bondCountry}
					onChange={setBondCountry}
					required
				/>
			)}
			<InputField
				label="Amount Invested"
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					validateField("amount", text, "amount");
				}}
				placeholder="e.g., 10000"
				keyboardType="decimal-pad"
				required
				error={errors.amount}
			/>
			<InputField
				label="Interest Rate (%)"
				value={interestRate}
				onChangeText={(text) => {
					setInterestRate(text);
					validateField("interestRate", text, "interest rate");
				}}
				placeholder="e.g., 4.5"
				keyboardType="decimal-pad"
				error={errors.interestRate}
				optional
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
				minimumDate={MIN_DATE}
				maximumDate={MAX_DATE}
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
				minimumDate={MIN_DATE}
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
				required
			/>
			<InputField
				label="Bank Name"
				value={bankName}
				onChangeText={setBankName}
				placeholder="e.g., Chase, BBVA"
				required
			/>
			<InputField
				label="Amount"
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					validateField("amount", text, "amount");
				}}
				placeholder="e.g., 5000"
				keyboardType="decimal-pad"
				required
				error={errors.amount}
			/>
			<InputField
				label="Interest Rate (%) - Annual"
				value={interestRate}
				onChangeText={(text) => {
					setInterestRate(text);
					validateField("interestRate", text, "interest rate");
				}}
				placeholder="e.g., 3.5"
				keyboardType="decimal-pad"
				error={errors.interestRate}
				optional
			/>
			<DateField
				label="Opening Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
				minimumDate={MIN_DATE}
				maximumDate={MAX_DATE}
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
				optional
				minimumDate={MIN_DATE}
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
				required
			/>
			<View className="mb-7">
				<SectionLabel required>Metal Type</SectionLabel>
				<ChipSelector
					options={METAL_TYPES}
					selected={metalType}
					onSelect={setMetalType}
				/>
			</View>
			<View className="mb-7 flex flex-row items-start justify-between gap-2">
				<View>
					<SectionLabel required>Format</SectionLabel>
					<ChipSelector
						options={METAL_FORMATS}
						selected={metalFormat}
					onSelect={(format) => {
						setMetalFormat(format);
						// Reset format-specific fields when switching
						if (format === "etf") {
							setQuantityUnit(null);
							setTotalPrice("");
						} else {
							setPurchasePrice("");
						}
					}}
					/>
				</View>
				{/* Show quantity unit selector only for physical */}
				{metalFormat === "physical" && (
					<View>
						<SectionLabel required>Quantity Unit</SectionLabel>
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
				onChangeText={(text) => {
					setQuantity(text);
					validateField("quantity", text, "quantity");
				}}
				placeholder="e.g., 10"
				keyboardType="decimal-pad"
				required
				error={errors.quantity}
			/>

		{/* Physical: ask for total price paid */}
		{metalFormat === "physical" && (
			<InputField
				label="Total Price Paid"
				value={totalPrice}
				onChangeText={(text) => {
					setTotalPrice(text);
					validateField("totalPrice", text, "price");
				}}
				placeholder="e.g., 5000"
				keyboardType="decimal-pad"
				error={errors.totalPrice}
				required
			/>
		)}

		{/* ETF: ask for purchase price per unit */}
		{metalFormat === "etf" && (
			<InputField
				label="Purchase Price (per unit)"
				value={purchasePrice}
				onChangeText={(text) => {
					setPurchasePrice(text);
					validateField("purchasePrice", text, "price");
				}}
				placeholder="e.g., 180.00"
				keyboardType="decimal-pad"
				error={errors.purchasePrice}
				required
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
				required
			/>
			<View className="mb-7">
				<SectionLabel required>Property Type</SectionLabel>
				<ChipSelector
					options={PROPERTY_TYPES}
					selected={propertyType}
					onSelect={(type) => setPropertyType(type as "residential" | "commercial" | "land" | "reit" | "crowdfunding" | "other" | null)}
				/>
			</View>
			<InputField
				label="Purchase Price"
				value={estimatedValue}
				onChangeText={(text) => {
					setEstimatedValue(text);
					validateField("estimatedValue", text, "price");
				}}
				placeholder="e.g., 250000"
				keyboardType="decimal-pad"
				required
				error={errors.estimatedValue}
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
				minimumDate={MIN_DATE}
				maximumDate={MAX_DATE}
			/>
			<CountryField
				label="Country"
				value={country}
				onChange={setCountry}
				required
			/>
			{/* City and Zip in a row */}
			<View className="flex-row gap-4 mb-7">
				<InlineInputField
					label="City"
					value={city}
					onChangeText={setCity}
					placeholder="e.g., Madrid"
					required
				/>
				<InlineInputField
					label="Zip"
					value={zip}
					onChangeText={setZip}
					placeholder="e.g., 28001"
					required
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
				required
			/>
			<View className="mb-7">
				<SectionLabel required>Investment Type</SectionLabel>
				<ChipSelector
					options={INVESTMENT_TYPES}
					selected={investmentType}
					onSelect={setInvestmentType}
				/>
			</View>
			<InputField
				label="Amount Invested"
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					validateField("amount", text, "amount");
				}}
				placeholder="e.g., 5000"
				keyboardType="decimal-pad"
				required
				error={errors.amount}
			/>
			<InputField
				label="Expected Return (%)"
				value={expectedReturn}
				onChangeText={(text) => {
					setExpectedReturn(text);
					validateField("expectedReturn", text, "expected return");
				}}
				placeholder="e.g., 12"
				keyboardType="decimal-pad"
				error={errors.expectedReturn}
				optional
			/>
			<DateField
				label="Purchase Date"
				value={purchaseDate}
				onChange={setPurchaseDate}
				optional
				minimumDate={MIN_DATE}
				maximumDate={MAX_DATE}
			/>
			<DateField
				label="Maturity Date"
				value={maturityDate}
				onChange={setMaturityDate}
				optional
				minimumDate={MIN_DATE}
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
				required
			/>
			<InputField
				label="Account / Location"
				value={accountName}
				onChangeText={setAccountName}
				placeholder="e.g., Chase Checking"
				required
			/>
			<InputField
				label="Amount"
				value={amount}
				onChangeText={(text) => {
					setAmount(text);
					validateField("amount", text, "amount");
				}}
				placeholder="e.g., 10000"
				keyboardType="decimal-pad"
				required
				error={errors.amount}
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
				onChangeText={(text) => {
					setQuantity(text);
					validateField("quantity", text, "quantity");
				}}
				placeholder="e.g., 0.5"
				keyboardType="decimal-pad"
				required
				error={errors.quantity}
			/>
			<InputField
				label="Purchase Price (per unit)"
				value={purchasePrice}
				onChangeText={(text) => {
					setPurchasePrice(text);
					validateField("purchasePrice", text, "price");
				}}
				placeholder="e.g., 45000"
				keyboardType="decimal-pad"
				error={errors.purchasePrice}
				required
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
					<Icon name="close-line" size="25" color={Colors.background} fallback={null} />
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
