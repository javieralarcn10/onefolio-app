export type User = {
	id: string;
	accessToken: string;
	firstName: string;
	email?: string;
	timezone: string;
	language: string;
	isPremium: boolean;
	createdAt: string;
	updatedAt: string;
};