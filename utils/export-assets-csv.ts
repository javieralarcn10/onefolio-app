import { getAssetValue } from "@/components/assets/asset-config";
import { Asset } from "@/types/custom";
import { getAssets } from "@/utils/storage";
import * as FileSystem from "expo-file-system/legacy";

const CSV_HEADERS = [
	"index",
	"type",
	"name",
	"currency",
	"currentValue",
	"createdAt",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRow = Record<CsvHeader, string | number>;

function escapeCsvValue(value: string | number): string {
	const raw = String(value ?? "");
	if (/[",\n\r]/.test(raw)) {
		return `"${raw.replace(/"/g, '""')}"`;
	}
	return raw;
}

function buildCsvRow(asset: Asset, index: number): CsvRow {
	return {
		index,
		type: asset.type,
		name: asset.name,
		currency: asset.currency,
		currentValue: getAssetValue(asset),
		createdAt: asset.createdAt,
	};
}

function buildAssetsCsv(assets: Asset[]): string {
	const headerLine = CSV_HEADERS.join(",");
	const lines = assets.map((asset, idx) => {
		const row = buildCsvRow(asset, idx + 1);
		return CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(",");
	});
	return [headerLine, ...lines].join("\n");
}

export async function createPortfolioCsvFile(): Promise<string | null> {
	const allAssets = await getAssets();
	const assetsToExport = allAssets.filter((asset) => getAssetValue(asset) > 0);
	if (assetsToExport.length === 0) return null;

	const cacheDirectory = FileSystem.cacheDirectory;
	if (!cacheDirectory) {
		throw new Error("Cache directory is not available.");
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const fileUri = `${cacheDirectory}onefolio-assets-${timestamp}.csv`;
	const csvContent = buildAssetsCsv(assetsToExport);

	await FileSystem.writeAsStringAsync(fileUri, csvContent, {
		encoding: FileSystem.EncodingType.UTF8,
	});

	return fileUri;
}
