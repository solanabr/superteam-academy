/**
 * @fileoverview Server actions for user profile management.
 * Handles database operations for updating user metadata and onboarding status.
 */
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * Interface definition for updating user profile data.
 * Ensures strict typing across the onboarding and settings forms.
 */
export interface ProfileUpdateData {
	name?: string;
	bio?: string;
	location?: string;
	github?: string;
	twitter?: string;
	website?: string;
	language?: string;
	publicVisibility?: boolean;
	notifications?: {
		newCourses: boolean;
		leaderboardAlerts: boolean;
		directMessages: boolean;
	};
	onboardingCompleted?: boolean;
	preferredTracks?: string; // JSON string array e.g. '["rust","defi"]'
	avatarSeed?: string;
}

/**
 * Updates the profile of the currently authenticated user.
 * @param data - The profile fields to update.
 * @returns An object indicating success or an error message.
 */
export async function updateUserProfile(data: ProfileUpdateData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return { error: "Not authenticated" };
	}

	try {
		await db
			.update(user)
			.set({
				...(data.name !== undefined && { name: data.name }),
				...(data.bio !== undefined && { bio: data.bio }),
				...(data.location !== undefined && { location: data.location }),
				...(data.github !== undefined && { github: data.github }),
				...(data.twitter !== undefined && { twitter: data.twitter }),
				...(data.website !== undefined && { website: data.website }),
				...(data.language !== undefined && { language: data.language }),
				...(data.publicVisibility !== undefined && {
					publicVisibility: data.publicVisibility,
				}),
				...(data.notifications !== undefined && {
					notifications: data.notifications,
				}),
				...(data.onboardingCompleted !== undefined && {
					onboardingCompleted: data.onboardingCompleted,
				}),
				...(data.preferredTracks !== undefined && {
					preferredTracks: data.preferredTracks,
				}),
				...(data.avatarSeed !== undefined && {
					avatarSeed: data.avatarSeed,
				}),
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id));

		revalidatePath("/");
		return { success: true };
	} catch (err) {
		console.error("Profile update failed:", err);
		return { error: "Failed to update profile" };
	}
}

/**
 * Fetches the profile data for the currently authenticated user from the database.
 * @returns The user data or null if not authenticated.
 */
export async function getUserProfileData() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return null;
	}

	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	return dbUser ?? null;
}

/**
 * Fetches profile data for any user by their unique ID or wallet address.
 * @param handle - The user's ID or wallet address.
 * @returns The user data or null.
 */
export async function getPublicProfileData(handle: string) {
	if (!handle) return null;

	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, handle),
	});

	if (!dbUser) {
		// Try by wallet address if ID doesn't match
		const byWallet = await db.query.user.findFirst({
			where: eq(user.walletAddress, handle),
		});
		return byWallet ?? null;
	}

	return dbUser;
}
