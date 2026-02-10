import { ASSETS_OPTIONS } from "@/components/assets/asset-config";
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
import { useHaptics } from "@/hooks/haptics";
import {
	Asset,
	AssetOption as AssetOptionType,
	AssetType,
	BondAsset,
	CashAsset,
	CryptoAsset,
	DepositAsset,
	PreciousMetalAsset,
	PrivateInvestmentAsset,
	RealEstateAsset,
	StockAsset,
} from "@/types/custom";
import { addAsset, generateAssetId, getAssets, removeAsset, updateAsset } from "@/utils/storage";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "react-native-remix-icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useSubscription } from "@/utils/subscription-context";
import { showPaywallIfNeeded } from "@/utils/revenue-cat";

// Local copy of asset options for when used from onboarding (type param is an id number)
const LOCAL_ASSETS_OPTIONS: AssetOptionType[] = [
	{
		id: 1,
		title: "Stocks & ETFs",
		description: "Stocks, index funds, ETFs",
		icon: "stock-line",
		assetType: "stocks_etfs" as AssetType,
		bgIcon: "#dbe7f0",
		colorIcon: "#213C51",
	},
	{
		id: 2,
		title: "Bonds & Fixed Income",
		description: "Bonds, treasury bills, fixed income",
		icon: "bank-line",
		assetType: "bonds" as AssetType,
		colorIcon: "#9E3B3B",
		bgIcon: "#f1dada",
	},
	{
		id: 3,
		title: "Deposits",
		description: "Fixed deposits, high-yield accounts",
		icon: "safe-3-line",
		assetType: "deposits" as AssetType,
		colorIcon: "#5C8D89",
		bgIcon: "#e0ebea",
	},
	{
		id: 4,
		title: "Precious Metals",
		description: "Gold, silver (physical or ETFs)",
		icon: "diamond-line",
		assetType: "precious_metals" as AssetType,
		colorIcon: "#FAB12F",
		bgIcon: "#feeccd",
	},
	{
		id: 5,
		title: "Real Estate",
		description: "Properties, REITs, crowdfunding",
		icon: "building-line",
		assetType: "real_estate" as AssetType,
		colorIcon: "#8B7BA8",
		bgIcon: "#f0ebf5",
	},
	{
		id: 6,
		title: "Private Investments",
		description: "Loans, crowdlending, equity stakes",
		icon: "hand-coin-line",
		assetType: "private_investments" as AssetType,
		colorIcon: "#116A7B",
		bgIcon: "#e9f9fc",
	},
	{
		id: 7,
		title: "Cash",
		description: "Cash, checking accounts",
		icon: "cash-line",
		assetType: "cash" as AssetType,
		colorIcon: "#7B6079",
		bgIcon: "#eee9ec",
	},
	{
		id: 8,
		title: "Crypto",
		description: "Bitcoin, Ethereum, others",
		icon: "btc-line",
		assetType: "crypto" as AssetType,
		colorIcon: "#F1935C",
		bgIcon: "#fce7dc",
	},
];

export default function AddAssetScreen() {
	const { triggerHaptics } = useHaptics();
	const { isPremium } = useSubscription();
	const { type, id } = useLocalSearchParams<{ type?: string; id?: string }>();

	// Determine if we're in edit mode
	const isEditMode = !!id;

	// For edit mode: loaded asset & loading state
	const [existingAsset, setExistingAsset] = useState<Asset | null>(null);
	const [isLoading, setIsLoading] = useState(isEditMode);

	// For add mode: resolve asset type from the type param
	const assetTypeId = type ? Number(type) : null;
	const assetOptionFromType = assetTypeId ? LOCAL_ASSETS_OPTIONS.find((option) => option.id === assetTypeId) : null;

	// The resolved asset type (from type param for add, from loaded asset for edit)
	const assetType: AssetType | undefined = isEditMode
		? existingAsset?.type
		: assetOptionFromType?.assetType;

	// The resolved asset option (for header title)
	const assetOption = isEditMode
		? (existingAsset ? ASSETS_OPTIONS.find((opt) => opt.assetType === existingAsset.type) || LOCAL_ASSETS_OPTIONS.find((opt) => opt.assetType === existingAsset.type) : null)
		: assetOptionFromType;

	// Store original values to compare for changes (edit mode only)
	const originalValues = useRef<Record<string, any>>({});

	// Common fields
	const [name, setName] = useState("");
	const [currency, setCurrency] = useState("USD");
	const [tickerType, setTickerType] = useState<string | null>(null);
	const [sector, setSector] = useState<string | undefined>(undefined);
	const [industry, setIndustry] = useState<string | undefined>(undefined);
	const [stockCountry, setStockCountry] = useState<string | undefined>(undefined);
	const [exchange, setExchange] = useState<string | undefined>(undefined);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

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

	// Load asset data for edit mode
	useEffect(() => {
		if (isEditMode && id) {
			loadAsset();
		}
	}, [id]);

	const loadAsset = async () => {
		try {
			const assets = await getAssets();
			const foundAsset = assets.find((a) => a.id === id);
			if (foundAsset) {
				setExistingAsset(foundAsset);
				populateFields(foundAsset);
			}
		} catch (error) {
			console.error("Error loading asset:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const populateFields = (asset: Asset) => {
		const originals: Record<string, any> = {
			currency: asset.currency,
			name: asset.name,
		};

		setCurrency(asset.currency);
		setName(asset.name);

		// Helper: treat 0 as empty for optional numeric fields
		const optionalNum = (val: number | undefined | null): string =>
			val && val !== 0 ? val.toString() : "";

		// Helper: treat dates that match createdAt as not explicitly set
		const optionalDate = (val: string | undefined | null): Date | null =>
			val && val !== asset.createdAt ? new Date(val) : null;

		switch (asset.type) {
			case "stocks_etfs": {
				const stockAsset = asset as StockAsset;
				setSelectedStockTicker(stockAsset.ticker);
				setSelectedStockName(stockAsset.name);
				setTickerType(stockAsset.tickerType);
				setSector(stockAsset.sector);
				setIndustry(stockAsset.industry);
				setStockCountry(stockAsset.country);
				setExchange(stockAsset.exchange);
				setQuantity(stockAsset.quantity.toString());
				setPurchasePrice(stockAsset.purchasePrice.toString());
				setPurchaseDate(optionalDate(stockAsset.purchaseDate));
				originals.ticker = stockAsset.ticker;
				originals.stockName = stockAsset.name;
				originals.tickerType = stockAsset.tickerType;
				originals.sector = stockAsset.sector;
				originals.industry = stockAsset.industry;
				originals.stockCountry = stockAsset.country;
				originals.exchange = stockAsset.exchange;
				originals.quantity = stockAsset.quantity.toString();
				originals.purchasePrice = stockAsset.purchasePrice.toString();
				originals.purchaseDate = stockAsset.purchaseDate;
				break;
			}
			case "bonds": {
				const bondAsset = asset as BondAsset;
				setBondType(bondAsset.bondType);
				setBondCountry(bondAsset.bondCountry || "");
				setAmount(bondAsset.amount.toString());
				setInterestRate(optionalNum(bondAsset.interestRate));
				setPurchaseDate(optionalDate(bondAsset.purchaseDate));
				setMaturityDate(bondAsset.maturityDate ? new Date(bondAsset.maturityDate) : null);
				originals.bondType = bondAsset.bondType;
				originals.bondCountry = bondAsset.bondCountry || "";
				originals.amount = bondAsset.amount.toString();
				originals.interestRate = optionalNum(bondAsset.interestRate);
				originals.purchaseDate = bondAsset.purchaseDate;
				originals.maturityDate = bondAsset.maturityDate;
				break;
			}
			case "deposits": {
				const depositAsset = asset as DepositAsset;
				setBankName(depositAsset.bankName);
				setAmount(depositAsset.amount.toString());
				setInterestRate(optionalNum(depositAsset.interestRate));
				setPurchaseDate(optionalDate(depositAsset.purchaseDate));
				setMaturityDate(depositAsset.maturityDate ? new Date(depositAsset.maturityDate) : null);
				originals.bankName = depositAsset.bankName;
				originals.amount = depositAsset.amount.toString();
				originals.interestRate = optionalNum(depositAsset.interestRate);
				originals.purchaseDate = depositAsset.purchaseDate;
				originals.maturityDate = depositAsset.maturityDate;
				break;
			}
			case "precious_metals": {
				const metalAsset = asset as PreciousMetalAsset;
				setMetalType(metalAsset.metalType);
				setMetalFormat(metalAsset.format);
				setQuantity(metalAsset.quantity.toString());
				setQuantityUnit(metalAsset.quantityUnit || null);
				setPurchasePrice(optionalNum(metalAsset.purchasePrice));
				// Reverse-compute total price for physical metals
				if (metalAsset.format === "physical" && metalAsset.purchasePrice && metalAsset.quantity) {
					setTotalPrice((metalAsset.purchasePrice * metalAsset.quantity).toString());
				}
				originals.metalType = metalAsset.metalType;
				originals.metalFormat = metalAsset.format;
				originals.quantity = metalAsset.quantity.toString();
				originals.quantityUnit = metalAsset.quantityUnit || null;
				originals.purchasePrice = optionalNum(metalAsset.purchasePrice);
				originals.totalPrice = metalAsset.format === "physical" && metalAsset.purchasePrice && metalAsset.quantity
					? (metalAsset.purchasePrice * metalAsset.quantity).toString()
					: "";
				break;
			}
			case "real_estate": {
				const realEstateAsset = asset as RealEstateAsset;
				setPropertyType(realEstateAsset.propertyType);
				setEstimatedValue(realEstateAsset.estimatedValue.toString());
				setCountry(realEstateAsset.country);
				setCity(realEstateAsset.city);
				setZip(realEstateAsset.zip);
				setPurchaseDate(optionalDate(realEstateAsset.purchaseDate));
				originals.propertyType = realEstateAsset.propertyType;
				originals.estimatedValue = realEstateAsset.estimatedValue.toString();
				originals.country = realEstateAsset.country;
				originals.city = realEstateAsset.city;
				originals.zip = realEstateAsset.zip;
				originals.purchaseDate = realEstateAsset.purchaseDate;
				break;
			}
			case "private_investments": {
				const privateAsset = asset as PrivateInvestmentAsset;
				setInvestmentType(privateAsset.investmentType);
				setAmount(privateAsset.amount.toString());
				setExpectedReturn(optionalNum(privateAsset.expectedReturn));
				setPurchaseDate(optionalDate(privateAsset.purchaseDate));
				setMaturityDate(privateAsset.maturityDate ? new Date(privateAsset.maturityDate) : null);
				originals.investmentType = privateAsset.investmentType;
				originals.amount = privateAsset.amount.toString();
				originals.expectedReturn = optionalNum(privateAsset.expectedReturn);
				originals.purchaseDate = privateAsset.purchaseDate;
				originals.maturityDate = privateAsset.maturityDate;
				break;
			}
			case "cash": {
				const cashAsset = asset as CashAsset;
				setAccountName(cashAsset.accountName);
				setAmount(cashAsset.amount.toString());
				originals.accountName = cashAsset.accountName;
				originals.amount = cashAsset.amount.toString();
				break;
			}
			case "crypto": {
				const cryptoAsset = asset as CryptoAsset;
				setSelectedCryptoSymbol(cryptoAsset.symbol);
				setSelectedCryptoName(cryptoAsset.name);
				setQuantity(cryptoAsset.quantity.toString());
				setPurchasePrice(optionalNum(cryptoAsset.purchasePrice));
				originals.symbol = cryptoAsset.symbol;
				originals.cryptoName = cryptoAsset.name;
				originals.quantity = cryptoAsset.quantity.toString();
				originals.purchasePrice = optionalNum(cryptoAsset.purchasePrice);
				break;
			}
		}

		originalValues.current = originals;
	};

	// Check if any field has changed (edit mode only)
	const hasChanges = useMemo(() => {
		if (!isEditMode || !existingAsset) return true; // In add mode, always allow saving
		const orig = originalValues.current;

		if (currency !== orig.currency || name !== orig.name) return true;

		switch (existingAsset.type) {
			case "stocks_etfs":
				return (
					selectedStockTicker !== orig.ticker ||
					selectedStockName !== orig.stockName ||
					tickerType !== orig.tickerType ||
					sector !== orig.sector ||
					industry !== orig.industry ||
					stockCountry !== orig.stockCountry ||
					exchange !== orig.exchange ||
					quantity !== orig.quantity ||
					purchasePrice !== orig.purchasePrice ||
					(purchaseDate?.toISOString() || null) !== (orig.purchaseDate || null)
				);
			case "bonds":
				return (
					bondType !== orig.bondType ||
					bondCountry !== orig.bondCountry ||
					amount !== orig.amount ||
					interestRate !== orig.interestRate ||
					(purchaseDate?.toISOString() || null) !== (orig.purchaseDate || null) ||
					(maturityDate?.toISOString() || null) !== (orig.maturityDate || null)
				);
			case "deposits":
				return (
					bankName !== orig.bankName ||
					amount !== orig.amount ||
					interestRate !== orig.interestRate ||
					(purchaseDate?.toISOString() || null) !== (orig.purchaseDate || null) ||
					(maturityDate?.toISOString() || null) !== (orig.maturityDate || null)
				);
			case "precious_metals":
				return (
					metalType !== orig.metalType ||
					metalFormat !== orig.metalFormat ||
					quantity !== orig.quantity ||
					quantityUnit !== orig.quantityUnit ||
					purchasePrice !== orig.purchasePrice ||
					totalPrice !== (orig.totalPrice || "")
				);
			case "real_estate":
				return (
					propertyType !== orig.propertyType ||
					estimatedValue !== orig.estimatedValue ||
					country !== orig.country ||
					city !== orig.city ||
					zip !== orig.zip ||
					(purchaseDate?.toISOString() || null) !== (orig.purchaseDate || null)
				);
			case "private_investments":
				return (
					investmentType !== orig.investmentType ||
					amount !== orig.amount ||
					expectedReturn !== orig.expectedReturn ||
					(purchaseDate?.toISOString() || null) !== (orig.purchaseDate || null) ||
					(maturityDate?.toISOString() || null) !== (orig.maturityDate || null)
				);
			case "cash":
				return accountName !== orig.accountName || amount !== orig.amount;
			case "crypto":
				return (
					selectedCryptoSymbol !== orig.symbol ||
					selectedCryptoName !== orig.cryptoName ||
					quantity !== orig.quantity ||
					purchasePrice !== orig.purchasePrice
				);
			default:
				return false;
		}
	}, [
		isEditMode, existingAsset, currency, name, selectedStockTicker, selectedStockName, tickerType,
		sector, industry, stockCountry, exchange, quantity, purchasePrice, purchaseDate, amount,
		interestRate, maturityDate, bondType, bondCountry, bankName, metalType, metalFormat, quantityUnit,
		propertyType, estimatedValue, country, city, zip, investmentType, expectedReturn, accountName,
		selectedCryptoSymbol, selectedCryptoName
	]);

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

	// Button animations
	const buttonScale = useSharedValue(1);
	const deleteButtonScale = useSharedValue(1);

	const buttonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: buttonScale.value }],
	}));

	const deleteButtonAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: deleteButtonScale.value }],
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

	const handleDeletePressIn = () => {
		deleteButtonScale.value = withTiming(0.98, {
			duration: 100,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleDeletePressOut = () => {
		deleteButtonScale.value = withTiming(1, {
			duration: 150,
			easing: Easing.out(Easing.ease),
		});
	};

	const handleDelete = () => {
		if (!existingAsset) return;

		Alert.alert(
			"Delete Asset",
			`Are you sure you want to delete "${existingAsset.name}"? This action cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsDeleting(true);
						try {
							await removeAsset(existingAsset.id);
							triggerHaptics("Success");
							router.replace("/(tabs)/assets");
						} catch (error) {
							triggerHaptics("Error");
							console.error("Error deleting asset:", error);
						} finally {
							setIsDeleting(false);
						}
					},
				},
			]
		);
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
		if (!isFormValid || !hasChanges) {
			triggerHaptics("Error");
			return;
		}

		if (!isEditMode && !isPremium) {
			const existingAssets = await getAssets();
			if (existingAssets.length >= 10) {
				Alert.alert(
					"Premium Feature",
					"You've reached the limit of 10 assets. Upgrade to Premium to add unlimited assets.",
					[
						{ text: "Cancel", style: "destructive" },
						{ text: "Upgrade", style: "default", onPress: () => showPaywallIfNeeded() },
					]
				);
				triggerHaptics("Error");
				return;
			}
		}

		setIsSaving(true);

		try {
			const now = new Date().toISOString();

			let asset: Asset;

			const baseFields = {
				id: isEditMode && existingAsset ? existingAsset.id : generateAssetId(),
				currency,
				createdAt: isEditMode && existingAsset ? existingAsset.createdAt : now,
				updatedAt: now,
			};

			switch (assetType) {
				case "stocks_etfs":
					asset = {
						...baseFields,
						name: selectedStockName!,
						type: "stocks_etfs",
						ticker: selectedStockTicker!,
						tickerType: tickerType!,
						sector: sector,
						industry: industry,
						country: stockCountry,
						exchange: exchange,
						quantity: parseFloat(quantity),
						purchasePrice: parseFloat(purchasePrice),
						purchaseDate: purchaseDate?.toISOString() || undefined,
					} as StockAsset;
					break;

				case "bonds":
					asset = {
						...baseFields,
						name: name.trim(),
						type: "bonds",
						bondType: bondType!,
						bondCountry: bondType === "government" ? bondCountry.trim() : undefined,
						amount: parseFloat(amount),
						interestRate: interestRate ? parseFloat(interestRate) : undefined,
						purchaseDate: purchaseDate?.toISOString() || undefined,
						maturityDate: maturityDate?.toISOString() || "",
					} as BondAsset;
					break;

				case "deposits":
					asset = {
						...baseFields,
						name: name.trim(),
						type: "deposits",
						bankName: bankName.trim(),
						amount: parseFloat(amount),
						interestRate: interestRate ? parseFloat(interestRate) : undefined,
						purchaseDate: purchaseDate?.toISOString(),
						maturityDate: maturityDate?.toISOString() || undefined,
					} as DepositAsset;
					break;

				case "precious_metals": {
					const qty = parseFloat(quantity);
					const pricePerUnit = metalFormat === "physical"
						? parseFloat(totalPrice) / qty
						: parseFloat(purchasePrice);
					asset = {
						...baseFields,
						name: name.trim(),
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
						...baseFields,
						name: name.trim(),
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
						...baseFields,
						name: name.trim(),
						type: "private_investments",
						investmentType: investmentType!,
						amount: parseFloat(amount),
						expectedReturn: expectedReturn ? parseFloat(expectedReturn) : undefined,
						purchaseDate: purchaseDate?.toISOString(),
						maturityDate: maturityDate?.toISOString() || undefined,
					} as PrivateInvestmentAsset;
					break;

				case "cash":
					asset = {
						...baseFields,
						name: name.trim(),
						type: "cash",
						accountName: accountName.trim(),
						amount: parseFloat(amount),
					} as CashAsset;
					break;

				case "crypto":
					asset = {
						...baseFields,
						name: selectedCryptoName!,
						type: "crypto",
						symbol: selectedCryptoSymbol!,
						quantity: parseFloat(quantity),
						purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
					} as CryptoAsset;
					break;

				default:
					throw new Error("Unknown asset type");
			}

			if (isEditMode) {
				await updateAsset(asset);
				triggerHaptics("Success");
				router.back();
			} else {
				await addAsset(asset);
				triggerHaptics("Success");
				router.replace("/(tabs)/assets");
			}
		} catch (error) {
			console.error("Error saving asset:", error);
			triggerHaptics("Error");
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
				disabled={isEditMode}
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
				disabled={isEditMode}
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

	// Loading state for edit mode
	if (isLoading) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator size="large" color={Colors.foreground} />
			</View>
		);
	}

	// Asset not found in edit mode
	if (isEditMode && !existingAsset) {
		return (
			<View className="flex-1 bg-background items-center justify-center px-10">
				<Text className="text-foreground text-lg font-lausanne-medium text-center mb-2">
					Asset not found
				</Text>
				<Pressable onPress={() => router.back()} className="mt-4">
					<Text className="text-accent text-base font-lausanne-regular">Go back</Text>
				</Pressable>
			</View>
		);
	}

	const isButtonDisabled = !isFormValid || !hasChanges || isSaving;

	return (
		<View className="flex-1 mb-safe">
			{/* Header */}
			<View className="px-5 pt-6 pb-5 flex-row items-center justify-between bg-foreground">
				<View className="flex-1">
					<Text className="text-xl font-lausanne-regular text-background">
						{isEditMode ? `Edit ${assetOption?.title}` : assetOption?.title}
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
			<View className="px-5 pb-5 pt-4 flex-row items-center gap-2">
				{isEditMode && <Animated.View style={[deleteButtonAnimatedStyle]}>
					<Pressable
						onPressIn={handleDeletePressIn}
						onPressOut={handleDeletePressOut}
						onPress={handleDelete}
						disabled={isDeleting}
						className={`bg-red-600 flex-row items-center justify-center py-4 h-16 aspect-square ${isDeleting ? "opacity-50" : ""}`}
					>
						{isDeleting ? (
							<ActivityIndicator size="small" color={Colors.background} />
						) : (
							<Icon name="delete-bin-line" size="20" color={Colors.background} fallback={null} />
						)}
					</Pressable>
				</Animated.View>}
				<Animated.View className="flex-1" style={[buttonAnimatedStyle]}>
					<Pressable
						disabled={isButtonDisabled}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onPress={handleSave}
						className={`bg-foreground flex-row items-center justify-center gap-3 py-4 ${isButtonDisabled ? "opacity-50" : ""}`}
					>
						{isSaving ? (
							<ActivityIndicator size="small" className="my-[4]" color={Colors.background} />
						) : (
							<Text className="text-white font-lausanne-light text-xl">
								{isEditMode ? "Update Asset" : "Add Asset"}
							</Text>
						)}
					</Pressable>
				</Animated.View>
			</View>
		</View>
	);
}
