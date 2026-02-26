import { createSanityClient } from "@superteam-academy/cms";
import type { AcademyUser, UserRole } from "@superteam-academy/cms";
import {
	userByAuthIdQuery,
	userByEmailQuery,
	userByWalletQuery,
	userByUsernameQuery,
	allUsersQuery,
	adminUsersQuery,
	userStatsQuery,
	userCountQuery,
} from "@superteam-academy/cms/queries";
import { generateUsername } from "./username-utils";

export type { AcademyUser };

// Cache clients at module level to reuse connections across requests
let _writeClient: ReturnType<typeof createSanityClient> | null | undefined;
let _readClient: ReturnType<typeof createSanityClient> | null | undefined;

function sanityWriteClient() {
	if (_writeClient !== undefined) return _writeClient;
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) {
		_writeClient = null;
		return null;
	}
	_writeClient = createSanityClient({ projectId, dataset, token, useCdn: false });
	return _writeClient;
}

function sanityReadClient() {
	if (_readClient !== undefined) return _readClient;
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) {
		_readClient = null;
		return null;
	}
	_readClient = createSanityClient({ projectId, dataset, token, useCdn: false });
	return _readClient;
}

function isSuperAdminIdentifier(emailOrWallet: string): boolean {
	const identifier = process.env.SUPER_ADMIN_IDENTIFIER;
	if (!identifier) return false;
	const ids = identifier.split(",").map((id) => id.trim());
	// Exact match first (wallet addresses are case-sensitive Base58)
	// then case-insensitive fallback (emails)
	return ids.some(
		(id) => id === emailOrWallet || id.toLowerCase() === emailOrWallet.toLowerCase()
	);
}

function determineRole(email: string, walletAddress?: string): UserRole {
	if (isSuperAdminIdentifier(email)) return "superadmin";
	if (walletAddress && isSuperAdminIdentifier(walletAddress)) return "superadmin";
	return "learner";
}

function normalizeWalletAddress(walletAddress?: string): string | undefined {
	if (!walletAddress) return undefined;
	const normalized = walletAddress.trim();
	return normalized.length > 0 ? normalized : undefined;
}

function rolePriority(role: UserRole): number {
	if (role === "superadmin") return 3;
	if (role === "admin") return 2;
	return 1;
}

function chooseHigherRole(a: UserRole, b: UserRole): UserRole {
	return rolePriority(a) >= rolePriority(b) ? a : b;
}

function mergeStringLists(a: string[] = [], b: string[] = []): string[] {
	return Array.from(new Set([...a, ...b]));
}

async function deleteUsersByIds(client: ReturnType<typeof createSanityClient>, ids: string[]) {
	if (ids.length === 0) return;

	for (const id of ids) {
		try {
			await client.delete(id);
		} catch (err) {
			console.error("[sanity-users] Failed to delete duplicate user:", id, err);
		}
	}
}

export async function syncUserToSanity(params: {
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	image?: string;
}): Promise<AcademyUser | null> {
	const client = sanityWriteClient();
	if (!client) return null;
	const normalizedWalletAddress = normalizeWalletAddress(params.walletAddress);

	const existing = await client.fetch<AcademyUser | null>(userByAuthIdQuery, {
		authId: params.authId,
	});
	const existingByWallet = normalizedWalletAddress
		? await client.fetch<AcademyUser | null>(userByWalletQuery, {
				walletAddress: normalizedWalletAddress,
			})
		: null;

	const now = new Date().toISOString();

	if (existingByWallet && existing && existingByWallet._id !== existing._id) {
		const patch: Record<string, unknown> = {
			authId: params.authId,
			name: params.name,
			email: params.email,
			walletAddress: normalizedWalletAddress,
			lastActiveAt: now,
			role: chooseHigherRole(existingByWallet.role, existing.role),
			xpBalance: Math.max(existingByWallet.xpBalance ?? 0, existing.xpBalance ?? 0),
			enrolledCourses: mergeStringLists(
				existingByWallet.enrolledCourses,
				existing.enrolledCourses
			),
			completedCourses: mergeStringLists(
				existingByWallet.completedCourses,
				existing.completedCourses
			),
			savedCourses: mergeStringLists(existingByWallet.savedCourses, existing.savedCourses),
			onboardingCompleted:
				Boolean(existingByWallet.onboardingCompleted) ||
				Boolean(existing.onboardingCompleted),
		};

		if (params.image) {
			patch.image = params.image;
		}

		if (!existingByWallet.username && existing.username) {
			patch.username = existing.username;
		}

		if (!existingByWallet.username && !existing.username) {
			patch.username = await generateUsername(params.name);
		}

		await client.patch(existingByWallet._id).set(patch).commit();
		await deleteUsersByIds(client, [existing._id]);

		const duplicateWalletUsers = await client.fetch<Array<{ _id: string }>>(
			`*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`,
			{ walletAddress: normalizedWalletAddress, keepId: existingByWallet._id }
		);
		await deleteUsersByIds(
			client,
			duplicateWalletUsers.map((user) => user._id)
		);

		return {
			...existingByWallet,
			...patch,
		} as AcademyUser;
	}

	if (!existing && existingByWallet) {
		const patch: Record<string, unknown> = {
			authId: params.authId,
			name: params.name,
			email: params.email,
			walletAddress: normalizedWalletAddress,
			lastActiveAt: now,
		};

		if (params.image) {
			patch.image = params.image;
		}

		if (!existingByWallet.username) {
			patch.username = await generateUsername(params.name);
		}

		if (existingByWallet.role === "learner") {
			const newRole = determineRole(params.email, normalizedWalletAddress);
			if (newRole !== "learner") {
				patch.role = newRole;
			}
		}

		await client.patch(existingByWallet._id).set(patch).commit();

		const duplicateWalletUsers = normalizedWalletAddress
			? await client.fetch<Array<{ _id: string }>>(
					`*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`,
					{ walletAddress: normalizedWalletAddress, keepId: existingByWallet._id }
				)
			: [];
		await deleteUsersByIds(
			client,
			duplicateWalletUsers.map((user) => user._id)
		);

		return {
			...existingByWallet,
			...patch,
		} as AcademyUser;
	}

	if (existing) {
		const patch: Record<string, unknown> = {
			name: params.name,
			email: params.email,
			lastActiveAt: now,
		};
		if (normalizedWalletAddress) {
			patch.walletAddress = normalizedWalletAddress;
		}
		if (params.image) {
			patch.image = params.image;
		}
		// Generate username if not exists
		if (!existing.username) {
			const username = await generateUsername(params.name);
			patch.username = username;
		}
		// Promote to superadmin if env matches
		if (existing.role === "learner") {
			const newRole = determineRole(params.email, normalizedWalletAddress);
			if (newRole !== "learner") {
				patch.role = newRole;
			}
		}
		try {
			await client.patch(existing._id).set(patch).commit();
			if (normalizedWalletAddress) {
				const duplicateWalletUsers = await client.fetch<Array<{ _id: string }>>(
					`*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`,
					{ walletAddress: normalizedWalletAddress, keepId: existing._id }
				);
				await deleteUsersByIds(
					client,
					duplicateWalletUsers.map((user) => user._id)
				);
			}
		} catch (err) {
			console.error("[sanity-users] Failed to patch user:", err);
		}
		return { ...existing, ...patch } as AcademyUser;
	}

	const role = determineRole(params.email, normalizedWalletAddress);
	// Generate username for new users
	const username = await generateUsername(params.name);
	const doc = {
		_type: "academyUser" as const,
		authId: params.authId,
		name: params.name,
		email: params.email,
		walletAddress: normalizedWalletAddress ?? "",
		image: params.image ?? "",
		username,
		role,
		xpBalance: 0,
		enrolledCourses: [] as string[],
		completedCourses: [] as string[],
		savedCourses: [] as string[],
		lastActiveAt: now,
	};

	try {
		const created = await client.create(doc);
		if (normalizedWalletAddress) {
			const duplicateWalletUsers = await client.fetch<Array<{ _id: string }>>(
				`*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`,
				{ walletAddress: normalizedWalletAddress, keepId: created._id as string }
			);
			await deleteUsersByIds(
				client,
				duplicateWalletUsers.map((user) => user._id)
			);
		}
		return { ...doc, ...created } as unknown as AcademyUser;
	} catch (err) {
		console.error("[sanity-users] Failed to create user:", err);
		return null;
	}
}

export async function getUserByAuthId(authId: string): Promise<AcademyUser | null> {
	const client = sanityReadClient();
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByAuthIdQuery, { authId });
}

export async function getUserByEmail(email: string): Promise<AcademyUser | null> {
	const client = sanityReadClient();
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByEmailQuery, { email });
}

export async function getUserByWallet(walletAddress: string): Promise<AcademyUser | null> {
	const client = sanityReadClient();
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByWalletQuery, { walletAddress });
}

export async function getUserByUsername(username: string): Promise<AcademyUser | null> {
	const client = sanityReadClient();
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByUsernameQuery, { username });
}

export async function getAllUsers(limit = 100, offset = 0): Promise<AcademyUser[]> {
	const client = sanityReadClient();
	if (!client) return [];
	const all = await client.fetch<AcademyUser[]>(allUsersQuery);
	return all.slice(offset, offset + limit);
}

export async function getAdminUsers(): Promise<AcademyUser[]> {
	const client = sanityReadClient();
	if (!client) return [];
	return client.fetch<AcademyUser[]>(adminUsersQuery);
}

export async function getUserCount(): Promise<number> {
	const client = sanityReadClient();
	if (!client) return 0;
	return client.fetch<number>(userCountQuery);
}

export async function getUserStats(): Promise<{
	totalUsers: number;
	activeUsers: number;
	adminCount: number;
	totalEnrollments: number;
}> {
	const client = sanityReadClient();
	if (!client) return { totalUsers: 0, activeUsers: 0, adminCount: 0, totalEnrollments: 0 };
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	return client.fetch(userStatsQuery, { since: thirtyDaysAgo });
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
	const client = sanityWriteClient();
	if (!client) return false;

	// Prevent demoting the env-configured super admin
	const user = await client.fetch<AcademyUser | null>(
		`*[_type == "academyUser" && _id == $id][0]{ email, walletAddress, role }`,
		{ id: userId }
	);
	if (!user) return false;
	if (user.role === "superadmin" && isSuperAdminIdentifier(user.email)) return false;
	if (
		user.walletAddress &&
		user.role === "superadmin" &&
		isSuperAdminIdentifier(user.walletAddress)
	)
		return false;

	await client.patch(userId).set({ role }).commit();
	return true;
}

export async function isUserAdmin(authId: string): Promise<boolean> {
	const user = await getUserByAuthId(authId);
	if (!user) return false;
	return user.role === "admin" || user.role === "superadmin";
}

export async function isUserSuperAdmin(authId: string): Promise<boolean> {
	const user = await getUserByAuthId(authId);
	if (!user) return false;
	return user.role === "superadmin";
}
