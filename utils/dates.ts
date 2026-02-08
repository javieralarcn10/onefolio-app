import { getLocales } from "expo-localization";

const { languageTag } = getLocales()[0];
const locale = languageTag || "en-US";

/** "15 Jan 2026" */
export function formatDate(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/** "15 Jan" (no year) */
export function formatDateShort(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, {
		day: "numeric",
		month: "short",
	});
}

/** "January 2026" */
export function formatMonthYear(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, {
		month: "long",
		year: "numeric",
	});
}

/** "15/01/2026" or "01/15/2026" depending on locale */
export function formatDateNumeric(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/** "15 Jan 2026, 14:30" */
export function formatDateTime(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/** Relative: "3 days ago", "in 2 months" */
export function formatRelative(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const now = new Date();
	const diffMs = d.getTime() - now.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

	if (Math.abs(diffDays) < 1) return rtf.format(0, "day");
	if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
	if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), "month");
	return rtf.format(Math.round(diffDays / 365), "year");
}
