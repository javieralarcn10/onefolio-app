import { getLocales } from "expo-localization";

const { languageTag } = getLocales()[0];
const locale = languageTag || "en-US";

export function formatNumber(number: number, currency?: string) {
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		style: currency ? "currency" : "decimal",
		currency: currency || undefined,
		currencyDisplay: currency ? "code" : undefined,
		useGrouping: true,
	}).format(number);
}