import { Asset } from "@/types/custom";
import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { getAssetDetails, getSectorInfo } from "./asset-detail-helpers";
import { COUNTRIES } from "@/utils/countries";

function DetailRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
	const isCountry = label.toLowerCase().includes("country")
	const isLocation = label.toLowerCase().includes("location");
	const location = isLocation ? value.split(", ")[1]?.trim() : null;
	const searchString = isCountry ? value.toLowerCase().trim() : isLocation ? location?.toLowerCase().trim() : null;
	const countryCode = searchString ? COUNTRIES.find((country) => country.name.toLowerCase() === searchString)?.code : null;
	return (
		<View className={`flex-row items-center justify-between py-3 ${isLast ? "" : "border-b border-border"}`}>
			<Text className="text-muted-foreground text-sm font-lausanne-regular flex-1">{label}</Text>
			<View className="flex-1 flex-row items-center gap-2.5 justify-end">
				{countryCode && <Image source={{ uri: countryCode }} style={{ width: 26, height: 16 }} />}
				<Text className="text-foreground text-sm font-lausanne-medium text-right">{value}</Text>
			</View>
		</View>
	);
}

export function DetailsSection({ asset, currentValue }: { asset: Asset; currentValue: string | undefined }) {
	const details = getAssetDetails(asset);

	if (currentValue) {
		const priceDetail = details.find((detail) => detail.label === "Current Price");
		if (priceDetail) {
			priceDetail.value = currentValue;
		}
	}

	return (
		<View className="mb-6">
			<Text className="text-foreground text-base font-lausanne-medium mb-2">Details</Text>
			<View className="bg-input border border-border px-4">
				{details.map((detail, index) => (
					<DetailRow
						key={index}
						label={detail.label}
						value={detail.value}
						isLast={index === details.length - 1}
					/>
				))}
			</View>
		</View>
	);
}

export function InformationSection({ asset }: { asset: Asset }) {
	const sectorInfo = getSectorInfo(asset);

	if (!sectorInfo) return null;

	const entries = Object.entries(sectorInfo);

	return (
		<View className="mb-6">
			<Text className="text-foreground text-base font-lausanne-medium mb-2">Information</Text>
			<View className="bg-input border border-border px-4">
				{entries.map(([key, value], index) => (
					<DetailRow
						key={index}
						label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
						value={value as string}
						isLast={index === entries.length - 1}
					/>
				))}
			</View>
		</View>
	);
}
