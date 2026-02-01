import { getLocales } from "expo-localization";

const { languageCode } = getLocales()[0];
const locale = languageCode || "en-US";

export function formatNumber(number: number) {
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		useGrouping: "always",
	}).format(number);
}