import { createSanityClient } from "@superteam-academy/cms";
import type { AcademyUser, UserRole } from "@superteam-academy/cms";
import { isWalletEmail, walletFromEmail } from "@superteam-academy/auth";
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
	const token = process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) {
		_readClient = null;
		return null;
	}
	_readClient = createSanityClient({ projectId, dataset, token, useCdn: false });
	return _readClient;
}

export function isSuperAdminIdentifier(emailOrWallet: string): boolean {
	const identifier = process.env.SUPER_ADMIN_IDENTIFIER;
	if (!identifier) return false;
	const normalizedInput = emailOrWallet.trim();
	if (normalizedInput.length === 0) return false;
	const ids = identifier
		.split(",")
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
	// Exact match first (wallet addresses are case-sensitive Base58)
	// then case-insensitive fallback (emails)
	return ids.some(
		(id) => id === normalizedInput || id.toLowerCase() === normalizedInput.toLowerCase()
	);
}

function isSessionSuperAdminIdentity(email?: string | null): boolean {
	if (!email) return false;
	if (isSuperAdminIdentifier(email)) return true;
	if (!isWalletEmail(email)) return false;
	const walletAddress = walletFromEmail(email);
	return walletAddress ? isSuperAdminIdentifier(walletAddress) : false;
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

function mergeStringLists(...lists: (string[] | undefined)[]): string[] {
	return Array.from(new Set(lists.flatMap((l) => l ?? [])));
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

type SanityClient = NonNullable<ReturnType<typeof sanityWriteClient>>;

async function patchAndCleanupByWallet(
	client: SanityClient,
	targetId: string,
	patch: Record<string, unknown>,
	walletAddress: string | undefined
) {
	await client.patch(targetId).set(patch).commit();
	if (walletAddress) {
		const dups = await client.fetch<Array<{ _id: string }>>(
			`*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`,
			{ walletAddress, keepId: targetId }
		);
		await deleteUsersByIds(
			client,
			dups.map((u) => u._id)
		);
	}
}

function buildBasePatch(
	params: { authId: string; name: string; email: string; image?: string },
	walletAddress: string | undefined,
	now: string
): Record<string, unknown> {
	const patch: Record<string, unknown> = {
		authId: params.authId,
		name: params.name,
		email: params.email,
		lastActiveAt: now,
	};
	if (walletAddress) patch.walletAddress = walletAddress;
	if (params.image) patch.image = params.image;
	return patch;
}

async function maybePromoteRole(
	patch: Record<string, unknown>,
	currentRole: string,
	email: string,
	walletAddress?: string
) {
	if (currentRole === "learner") {
		const newRole = determineRole(email, walletAddress);
		if (newRole !== "learner") patch.role = newRole;
	}
}

async function adoptExistingUser(
	client: SanityClient,
	target: AcademyUser,
	params: { authId: string; name: string; email: string; image?: string },
	walletAddress: string | undefined,
	now: string
): Promise<AcademyUser> {
	const patch = buildBasePatch(params, walletAddress, now);
	if (!target.username) patch.username = await generateUsername(params.name);
	await maybePromoteRole(patch, target.role, params.email, walletAddress);
	await patchAndCleanupByWallet(client, target._id, patch, walletAddress);
	return { ...target, ...patch } as AcademyUser;
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
	const existingByEmail =
		!existing && !existingByWallet
			? await client.fetch<AcademyUser | null>(userByEmailQuery, { email: params.email })
			: null;

	const now = new Date().toISOString();

	// Two different Sanity users found (one by authId, one by wallet): merge them
	if (existingByWallet && existing && existingByWallet._id !== existing._id) {
		const patch: Record<string, unknown> = {
			...buildBasePatch(params, normalizedWalletAddress, now),
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

		if (!existingByWallet.username && existing.username) {
			patch.username = existing.username;
		}
		if (!existingByWallet.username && !existing.username) {
			patch.username = await generateUsername(params.name);
		}

		await client.patch(existingByWallet._id).set(patch).commit();
		await deleteUsersByIds(client, [existing._id]);
		await patchAndCleanupByWallet(client, existingByWallet._id, {}, normalizedWalletAddress);

		return { ...existingByWallet, ...patch } as AcademyUser;
	}

	// Found by wallet but not authId: adopt existing wallet user
	if (!existing && existingByWallet) {
		return adoptExistingUser(client, existingByWallet, params, normalizedWalletAddress, now);
	}

	// Found by authId: update in place
	if (existing) {
		const patch: Record<string, unknown> = {
			name: params.name,
			email: params.email,
			lastActiveAt: now,
		};
		if (normalizedWalletAddress) patch.walletAddress = normalizedWalletAddress;
		if (params.image) patch.image = params.image;
		if (!existing.username) patch.username = await generateUsername(params.name);
		await maybePromoteRole(patch, existing.role, params.email, normalizedWalletAddress);
		try {
			await patchAndCleanupByWallet(client, existing._id, patch, normalizedWalletAddress);
		} catch (err) {
			console.error("[sanity-users] Failed to patch user:", err);
		}
		return { ...existing, ...patch } as AcademyUser;
	}

	// Fallback: find by email when authId and wallet both miss (e.g., after auth DB reset)
	if (existingByEmail) {
		return adoptExistingUser(client, existingByEmail, params, normalizedWalletAddress, now);
	}

	// Brand new user
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

export async function isUserAdmin(authId: string, sessionEmail?: string | null): Promise<boolean> {
	const user = await getUserByAuthId(authId);
	if (user && (user.role === "admin" || user.role === "superadmin")) {
		return true;
	}

	return isSessionSuperAdminIdentity(sessionEmail);
}

export async function isUserSuperAdmin(
	authId: string,
	sessionEmail?: string | null
): Promise<boolean> {
	const user = await getUserByAuthId(authId);
	if (user?.role === "superadmin") {
		return true;
	}

	return isSessionSuperAdminIdentity(sessionEmail);
}
