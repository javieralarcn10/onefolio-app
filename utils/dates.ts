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
	const diffMs = now.getTime() - d.getTime();
	const absMs = Math.abs(diffMs);
	const absSeconds = Math.floor(absMs / 1000);
	const absMinutes = Math.floor(absSeconds / 60);
	const absHours = Math.floor(absMinutes / 60);
	const absDays = Math.floor(absHours / 24);
	const absWeeks = Math.floor(absDays / 7);
	const absMonths = Math.floor(absDays / 30);
	const absYears = Math.floor(absDays / 365);

	const isFuture = diffMs < 0;
	const suffix = (value: number, unit: string) => {
		const plural = value !== 1 ? "s" : "";
		return isFuture
			? `in ${value} ${unit}${plural}`
			: `${value} ${unit}${plural} ago`;
	};

	if (absSeconds < 60) return isFuture ? "soon" : "just now";
	if (absMinutes < 60) return suffix(absMinutes, "minute");
	if (absHours < 24) return suffix(absHours, "hour");
	if (absDays < 7) return suffix(absDays, "day");
	if (absWeeks < 5) return suffix(absWeeks, "week");
	if (absMonths < 12) return suffix(Math.max(absMonths, 1), "month");
	return suffix(Math.max(absYears, 1), "year");
}
