import { IconName } from "react-native-remix-icon";

export type User = {
	id: string;
	referralCode: string;
	accessToken: string;
	notificationToken: string | null;
	firstName: string;
	email?: string;
	timezone: string;
	language: string;
	investorProfile?: string;
	investmentGoals?: string;
	currency: string;
	isPremium: boolean;
	createdAt: string;
	updatedAt: string;
};

export type OnboardingOption = {
	id: number;
	title: string;
	feedback?: string;
	icon?: React.ElementType;
};

export type AssetOption = {
	id: number;
	title: string;
	description: string;
	icon: IconName;
	bgIcon: string;
	colorIcon: string;
	assetType: AssetType;
};

export type BiometricType = "faceid" | "fingerprint" | "none";

// Asset Types
export type AssetType =
	| 'stocks_etfs'
	| 'bonds'
	| 'deposits'
	| 'precious_metals'
	| 'real_estate'
	| 'private_investments'
	| 'cash'
	| 'crypto';

export type BaseAsset = {
	id: string;
	type: AssetType;
	name: string;
	currency: string;
	createdAt: string;
	updatedAt: string;
	transactions?: Transaction[];
};

export type StockAsset = BaseAsset & {
	type: 'stocks_etfs';
	ticker: string;
	quantity: number;
	purchasePrice: number;
	purchaseDate: string;
	tickerType: string;
	sector?: string;
	industry?: string;
	country?: string;
	exchange?: string;
};

export type BondAsset = BaseAsset & {
	type: 'bonds';
	bondType: 'government' | 'corporate';
	bondCountry?: string; // Required when bondType is 'government'
	amount: number;
	interestRate: number;
	purchaseDate: string;
	maturityDate: string;
};

export type DepositAsset = BaseAsset & {
	type: 'deposits';
	bankName: string;
	amount: number;
	interestRate: number;
	maturityDate?: string;
	purchaseDate?: string;
};

export type PreciousMetalAsset = BaseAsset & {
	type: 'precious_metals';
	metalType: 'gold' | 'silver' | 'platinum' | 'palladium';
	format: 'physical' | 'etf';
	quantity: number;
	quantityUnit?: 'oz' | 'g'; // Only for physical
	purchasePrice: number;
};

export type RealEstateAsset = BaseAsset & {
	type: 'real_estate';
	propertyType: 'residential' | 'commercial' | 'land' | 'reit' | 'crowdfunding' | 'other';
	estimatedValue: number;
	country: string;
	city: string;
	zip: string;
	purchaseDate?: string;
};

export type PrivateInvestmentAsset = BaseAsset & {
	type: 'private_investments';
	investmentType: 'loan' | 'crowdlending' | 'equity' | 'other';
	amount: number;
	expectedReturn?: number;
	maturityDate?: string;
	purchaseDate?: string;
};

export type CashAsset = BaseAsset & {
	type: 'cash';
	accountName: string;
	amount: number;
};

export type CryptoAsset = BaseAsset & {
	type: 'crypto';
	symbol: string;
	quantity: number;
	purchasePrice: number;
};

export type Asset =
	| StockAsset
	| BondAsset
	| DepositAsset
	| PreciousMetalAsset
	| RealEstateAsset
	| PrivateInvestmentAsset
	| CashAsset
	| CryptoAsset;

export type QuickAction = { id: string; title: string; description: string; icon: IconName; disabled: boolean; onPress: () => void };

// ── Transactions ──────────────────────────────────────────────────────────

export type TransactionType = 'buy' | 'sell';

export type Transaction = {
	id: string;
	type: TransactionType;
	date: string;
	quantity?: number;       // For quantity-based assets (stocks, crypto, metals)
	pricePerUnit?: number;   // Price per unit at time of transaction
	amount: number;          // Total value of the transaction
	notes?: string;
};
