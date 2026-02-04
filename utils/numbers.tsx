import { getLocales } from "expo-localization";

const { languageCode } = getLocales()[0];
const locale = languageCode || "en-US";

export function formatNumber(number: number, currency?: string) {
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		style: currency ? "currency" : "decimal",
		currency: currency || undefined,
		currencyDisplay: currency ? "code" : undefined,
		useGrouping: "always",
	}).format(number);
}