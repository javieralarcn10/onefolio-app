import { Asset } from "@/types/custom";
import React, { createContext, useCallback, useContext, useState } from "react";

type OnboardingContextType = {
	pendingAssets: Asset[];
	addPendingAsset: (asset: Asset) => void;
	removePendingAsset: (assetId: string) => void;
	clearPendingAssets: () => void;
	getAssetCountByType: (assetType: string) => number;
	getAssetsByType: (assetType: string) => Asset[];
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
	const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);

	const addPendingAsset = useCallback((asset: Asset) => {
		setPendingAssets((prev) => [...prev, asset]);
	}, []);

	const removePendingAsset = useCallback((assetId: string) => {
		setPendingAssets((prev) => prev.filter((a) => a.id !== assetId));
	}, []);

	const clearPendingAssets = useCallback(() => {
		setPendingAssets([]);
	}, []);

	const getAssetCountByType = useCallback(
		(assetType: string) => {
			return pendingAssets.filter((asset) => asset.type === assetType).length;
		},
		[pendingAssets]
	);

	const getAssetsByType = useCallback(
		(assetType: string) => {
			return pendingAssets.filter((asset) => asset.type === assetType);
		},
		[pendingAssets]
	);

	return (
		<OnboardingContext.Provider
			value={{
				pendingAssets,
				addPendingAsset,
				removePendingAsset,
				clearPendingAssets,
				getAssetCountByType,
				getAssetsByType,
			}}
		>
			{children}
		</OnboardingContext.Provider>
	);
}

export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error("useOnboarding must be used within an OnboardingProvider");
	}
	return context;
}
