import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

// ============================================================================
// Constants
// ============================================================================

// TODO: Mover estas claves a variables de entorno o expo-constants
// Por seguridad, estas claves deberían estar en app.config.js con extra
const REVENUECAT_API_KEYS = {
	ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "",
	android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "", // Agregar la key real de Android
};

// Nombre del entitlement en RevenueCat Dashboard
export const PRO_ENTITLEMENT_ID = "Pro access";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Inicializa RevenueCat SDK
 * Debe llamarse una sola vez al inicio de la aplicación
 */
export const initializeRevenueCat = (userId?: string): void => {
	try {
		// Configurar nivel de logs (usar DEBUG en desarrollo, ERROR en producción)
		if (__DEV__) {
			Purchases.setLogLevel(LOG_LEVEL.ERROR);
		} else {
			Purchases.setLogLevel(LOG_LEVEL.ERROR);
		}

		// Seleccionar la API key según la plataforma
		const apiKey = Platform.OS === "ios" ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

		if (!apiKey) {
			console.error(`[RevenueCat] API key not found for platform: ${Platform.OS}`);
			return;
		}

		// Configurar RevenueCat
		Purchases.configure({
			apiKey
		});
		Purchases.enableAdServicesAttributionTokenCollection();

	} catch (error) {
		console.error("[RevenueCat] Initialization failed:", error);
	}
};

// ============================================================================
// User Management
// ============================================================================

/**
 * Establece el ID del usuario en RevenueCat
 * Útil para identificar al usuario después de login/registro
 */
export const setRevenueCatUserId = async ({ userId, email, firstName }: { userId: string; email?: string; firstName: string; }): Promise<void> => {
	try {
		await Purchases.logIn(userId);
		if (email) {
			await Purchases.setEmail(email);
		}
		await Purchases.setDisplayName(firstName);
	} catch (error) {
		console.error("[RevenueCat] Failed to set user attributes:", error);
	}
};

/**
 * Cierra la sesión del usuario en RevenueCat
 * Útil al hacer logout
 */
export const logoutRevenueCat = async (): Promise<void> => {
	try {
		await Purchases.logOut();
	} catch (error) {
		console.error("[RevenueCat] Failed to logout:", error);
	}
};

// ============================================================================
// Subscription Status
// ============================================================================

/**
 * Verifica si el usuario tiene una suscripción activa
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
	try {
		const customerInfo = await Purchases.getCustomerInfo();
		return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== "undefined";
	} catch (error) {
		console.error("[RevenueCat] Failed to check subscription status:", error);
		return false;
	}
};

/**
 * Obtiene información del cliente
 */
export const getCustomerInfo = async () => {
	try {
		return await Purchases.getCustomerInfo();
	} catch (error) {
		console.error("[RevenueCat] Failed to get customer info:", error);
		throw error;
	}
};

/**
 * Verifica si el usuario ya ha usado un trial anteriormente
 * Devuelve true si el usuario ya utilizó el período de prueba gratuito en algún momento
 */
export const hasUsedTrialBefore = async (): Promise<boolean> => {
	try {
		const customerInfo = await Purchases.getCustomerInfo();

		// Verificar si el entitlement existe en 'all' (incluye trials/suscripciones expiradas)
		const entitlement = customerInfo.entitlements.all[PRO_ENTITLEMENT_ID];

		if (entitlement) {
			// El usuario ha tenido este entitlement en algún momento
			// Esto significa que ya usó el trial o tuvo una suscripción
			return true;
		}

		// También verificar si hay productos comprados anteriormente
		const purchasedProducts = customerInfo.allPurchasedProductIdentifiers;
		if (purchasedProducts && purchasedProducts.length > 0) {
			// El usuario ha comprado/probado algún producto
			return true;
		}

		return false;
	} catch (error) {
		console.error("[RevenueCat] Failed to check trial status:", error);
		return false;
	}
};

/**
 * Verifica si el usuario está actualmente en un período de trial
 */
export const isCurrentlyOnTrial = async (): Promise<boolean> => {
	try {
		const customerInfo = await Purchases.getCustomerInfo();
		const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

		if (entitlement) {
			// periodType puede ser: "NORMAL", "TRIAL", o "INTRO"
			return entitlement.periodType === "TRIAL";
		}

		return false;
	} catch (error) {
		console.error("[RevenueCat] Failed to check trial period:", error);
		return false;
	}
};

// ============================================================================
// Error Types
// ============================================================================

export enum PurchaseErrorType {
	USER_CANCELLED = "USER_CANCELLED",
	NETWORK_ERROR = "NETWORK_ERROR",
	STORE_PROBLEM = "STORE_PROBLEM",
	PAYMENT_PENDING = "PAYMENT_PENDING",
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
	UNKNOWN = "UNKNOWN",
}

/**
 * Clasifica el tipo de error de compra
 */
export const classifyPurchaseError = (error: any): PurchaseErrorType => {
	if (!error) return PurchaseErrorType.UNKNOWN;

	// Usuario canceló la compra
	if (error.userCancelled) {
		return PurchaseErrorType.USER_CANCELLED;
	}

	// Error de red
	if (error.code === "NETWORK_ERROR" || error.message?.toLowerCase().includes("network")) {
		return PurchaseErrorType.NETWORK_ERROR;
	}

	// Problema con la tienda
	if (error.code === "STORE_PROBLEM" || error.code === "PURCHASE_NOT_ALLOWED") {
		return PurchaseErrorType.STORE_PROBLEM;
	}

	// Pago pendiente
	if (error.code === "PAYMENT_PENDING") {
		return PurchaseErrorType.PAYMENT_PENDING;
	}

	// Credenciales inválidas
	if (error.code === "INVALID_CREDENTIALS") {
		return PurchaseErrorType.INVALID_CREDENTIALS;
	}

	return PurchaseErrorType.UNKNOWN;
};

/**
 * Obtiene un mensaje de error amigable según el tipo
 */
export const getErrorMessage = (errorType: PurchaseErrorType): string => {
	switch (errorType) {
		case PurchaseErrorType.USER_CANCELLED:
			return "Purchase cancelled";
		case PurchaseErrorType.NETWORK_ERROR:
			return "Network connection error. Please check your internet and try again.";
		case PurchaseErrorType.STORE_PROBLEM:
			return "There's a problem with the store. Please try again later.";
		case PurchaseErrorType.PAYMENT_PENDING:
			return "Your payment is pending. It may take a few minutes to process.";
		case PurchaseErrorType.INVALID_CREDENTIALS:
			return "Invalid credentials. Please try again.";
		default:
			return "An error occurred. Please try again.";
	}
};

/**
 * Determines paywall variant (A/B) based on RevenueCat ID using consistent hashing
 * @param rcId - The RevenueCat user ID (may include "RCAnonymousID:" prefix)
 * @returns "A" or "B" variant with 50/50 distribution, defaults to "A" on error
 */
export const getPaywallVariant = (rcId: string): "A" | "B" => {
	try {
		// Validate input
		if (!rcId || typeof rcId !== "string" || rcId.trim() === "") {
			return "A";
		}

		// Remove RevenueCat prefix if present and normalize
		const cleanId = rcId.replace(/^RCAnonymousID:/, "").toLowerCase();

		// Validate cleaned ID has content
		if (!cleanId || cleanId.length === 0) {
			return "A";
		}

		// Sum hexadecimal character values for consistent hash
		const hash = cleanId.split("").reduce((total, char) => {
			const value = parseInt(char, 16);
			return total + (isNaN(value) ? 0 : value);
		}, 0);

		// Validate hash is a valid number
		if (isNaN(hash) || !isFinite(hash)) {
			return "A";
		}

		// 50/50 split based on modulo
		return hash % 100 < 50 ? "A" : "B";
	} catch (error) {
		console.error("[RevenueCat] Error determining paywall variant:", error);
		return "A";
	}
};
