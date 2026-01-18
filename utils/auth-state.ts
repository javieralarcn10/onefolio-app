import { useLayoutEffect, useState } from "react";
import { hasCompletedOnboarding } from "./storage";

export function useAuthState() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [loading, setLoading] = useState(true);

	useLayoutEffect(() => {
		checkAuthState();
	}, []);

	const checkAuthState = async () => {
		try {
			const completed = await hasCompletedOnboarding();
			setIsLoggedIn(completed);
		} finally {
			setLoading(false);
		}
	};

	return {
		isLoggedIn,
		setIsLoggedIn,
		loading,
	};
}