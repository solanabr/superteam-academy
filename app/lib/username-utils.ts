"use server";

import type { AcademyUser } from "@superteam-academy/cms";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;

/**
 * Validates if a username is valid
 */
export async function isValidUsername(username: string): Promise<boolean> {
	if (
		!username ||
		username.length < MIN_USERNAME_LENGTH ||
		username.length > MAX_USERNAME_LENGTH
	) {
		return false;
	}

	return USERNAME_REGEX.test(username);
}

function sanitizeUsername(username: string): string {
	return username
		.toLowerCase()
		.replace(/[^a-zA-Z0-9_-]/g, "")
		.replace(/_+/g, "_")
		.replace(/-+/g, "-")
		.replace(/^[-_]+|[-_]+$/g, "");
}

/**
 * Generates a unique username from a name
 */
export async function generateUsername(
	baseName: string,
	existingUsernames: string[] = []
): Promise<string> {
	const sanitized = sanitizeUsername(baseName);

	// If the sanitized name is valid and not taken, use it
	if ((await isValidUsername(sanitized)) && !existingUsernames.includes(sanitized)) {
		return sanitized;
	}

	// Try adding random numbers until we find an available username
	let attempts = 0;
	let candidate = sanitized;

	while (existingUsernames.includes(candidate) && attempts < 100) {
		const randomNum = Math.floor(Math.random() * 9999) + 1;
		candidate = `${sanitized}${randomNum}`;
		attempts++;
	}

	// If we still haven't found one, use a completely random username
	if (existingUsernames.includes(candidate)) {
		candidate = `user${Date.now().toString().slice(-6)}`;
	}

	return candidate;
}

/**
 * Checks if a username is available (not in use)
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
	try {
		if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
			throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not configured");
		}
		if (!process.env.SANITY_API_READ_TOKEN) {
			throw new Error("SANITY_API_READ_TOKEN is not configured");
		}

		const { createSanityClient } = await import("@superteam-academy/cms");
		const client = createSanityClient({
			projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
			dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
			token: process.env.SANITY_API_READ_TOKEN,
			useCdn: false,
		});

		const existing = await client.fetch(
			`count(*[_type == "academyUser" && username == $username])`,
			{ username }
		);

		return existing === 0;
	} catch (error) {
		console.error("Error checking username availability:", error);
		return false;
	}
}

/**
 * Calculates profile completeness percentage
 */
export async function calculateProfileCompleteness(user: AcademyUser): Promise<number> {
	const fields = [
		user.name,
		user.bio,
		user.location,
		user.title,
		user.experienceLevel,
		(user.learningGoals?.length ?? 0) > 0,
		(user.skills?.length ?? 0) > 0,
		user.github,
		user.linkedin,
		user.username,
	];

	const filledFields = fields.filter(Boolean).length;
	return Math.round((filledFields / fields.length) * 100);
}

/**
 * Gets username suggestions based on user data
 */
export async function getUsernameSuggestions(user: {
	name?: string;
	email?: string;
}): Promise<string[]> {
	const suggestions: string[] = [];

	if (user.name) {
		const nameParts = user.name.toLowerCase().split(" ");
		const firstName = nameParts[0];
		const lastName = nameParts[nameParts.length - 1];

		suggestions.push(firstName);
		suggestions.push(`${firstName}${lastName}`);
		suggestions.push(`${firstName}_${lastName}`);
	}

	if (user.email) {
		const emailPrefix = user.email.split("@")[0];
		if (emailPrefix && emailPrefix !== user.name?.toLowerCase().split(" ")[0]) {
			suggestions.push(emailPrefix);
		}
	}

	return suggestions.filter(
		(suggestion) =>
			suggestion.length >= MIN_USERNAME_LENGTH &&
			suggestion.length <= MAX_USERNAME_LENGTH &&
			USERNAME_REGEX.test(suggestion)
	);
}
