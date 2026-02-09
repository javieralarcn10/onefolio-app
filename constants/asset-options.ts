// Bond types
export const BOND_TYPES = [
	{ id: "government", label: "Government" },
	{ id: "corporate", label: "Corporate" },
] as const;

// Metal types
export const METAL_TYPES = [
	{ id: "gold", label: "Gold" },
	{ id: "silver", label: "Silver" },
	{ id: "platinum", label: "Platinum" },
	{ id: "palladium", label: "Palladium" }
] as const;

// Metal formats
export const METAL_FORMATS = [
	{ id: "physical", label: "Physical" },
	{ id: "etf", label: "ETF" },
] as const;

// Quantity units for physical metals
export const QUANTITY_UNITS = [
	{ id: "oz", label: "Ounces (oz)" },
	{ id: "g", label: "Grams (g)" },
] as const;

// Property types
export const PROPERTY_TYPES = [
	{ id: "Residential", label: "Residential" },
	{ id: "commercial", label: "Commercial" },
	{ id: "land", label: "Land" },
	{ id: "reit", label: "REIT" },
	{ id: "crowdfunding", label: "Crowdfunding" },
	{ id: "other", label: "Other" },
] as const;

// Private investment types
export const INVESTMENT_TYPES = [
	{ id: "loan", label: "Loan" },
	{ id: "crowdlending", label: "Crowdlending" },
	{ id: "equity", label: "Equity Stake" },
	{ id: "other", label: "Other" },
] as const;
