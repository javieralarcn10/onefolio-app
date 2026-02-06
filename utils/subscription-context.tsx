import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { PRO_ENTITLEMENT_ID } from "./revenue-cat";

// ============================================================================
// Types
// ============================================================================

type SubscriptionContextType = {
	isPremium: boolean;
	isLoadingSubscription: boolean;
};

// ============================================================================
// Context
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextType>({
	isPremium: false,
	isLoadingSubscription: true,
});

// ============================================================================
// Hook
// ============================================================================

export function useSubscription() {
	const value = useContext(SubscriptionContext);
	if (!value) {
		throw new Error("useSubscription must be wrapped in a <SubscriptionProvider />");
	}
	return value;
}

// ============================================================================
// Provider
// ============================================================================

export function SubscriptionProvider({ children }: PropsWithChildren) {
	const [isPremium, setIsPremium] = useState(false);
	const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

	useEffect(() => {
		// Initial check on mount
		const checkInitial = async () => {
			try {
				const customerInfo = await Purchases.getCustomerInfo();
				updateFromCustomerInfo(customerInfo);
			} catch (error) {
				console.error("[Subscription] Initial check failed:", error);
			} finally {
				setIsLoadingSubscription(false);
			}
		};

		// Reactive listener — fires when:
		// - SDK refreshes on app foreground
		// - A purchase completes
		// - Subscription expires/renews
		// - Changes from another device
		const unsubscribe = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
			updateFromCustomerInfo(customerInfo);
		});

		checkInitial();

		return unsubscribe;
	}, []);

	const updateFromCustomerInfo = (customerInfo: CustomerInfo) => {
		const hasEntitlement =
			typeof customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== "undefined";
		setIsPremium(hasEntitlement);
	};

	return (
		<SubscriptionContext.Provider value={{ isPremium, isLoadingSubscription }}>
			{children}
		</SubscriptionContext.Provider>
	);
}
