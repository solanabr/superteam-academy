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
import { WALLET_EMAIL_DOMAIN } from "@/packages/auth/src/wallet-utils";

export type { AcademyUser };

// Cache clients at module level to reuse connections across requests
let _writeClient: ReturnType<typeof createSanityClient> | null | undefined;
let _readClient: ReturnType<typeof createSanityClient> | null | undefined;
const DUPLICATE_WALLET_USERS_QUERY = `*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`;

type SyncUserParams = {
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	image?: string;
};

function getSanityClient(kind: "read" | "write") {
	if (kind === "write") {
		if (_writeClient !== undefined) return _writeClient;
	} else if (_readClient !== undefined) return _readClient;

	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token =
		kind === "write"
			? process.env.SANITY_API_WRITE_TOKEN
			: (process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN);

	if (!projectId || !token) {
		if (kind === "write") {
			_writeClient = null;
			return _writeClient;
		}
		_readClient = null;
		return _readClient;
	}

	const client = createSanityClient({ projectId, dataset, token, useCdn: false });
	if (kind === "write") {
		_writeClient = client;
		return _writeClient;
	}
	_readClient = client;
	return _readClient;
}

export function isSuperAdminIdentifier(emailOrWallet: string): boolean {
	const identifier = process.env.SUPER_ADMIN_IDENTIFIER;
	if (!identifier) return false;
	const normalizedInput = emailOrWallet.trim().replace(WALLET_EMAIL_DOMAIN, "");
	if (normalizedInput.length === 0) return false;
	const ids = identifier
		.split(",")
		.map((id) => id.trim())
		.filter((id) => id.length > 0);

	return ids.some(
		(id) => id === normalizedInput || id.toLowerCase() === normalizedInput.toLowerCase()
	);
}

function determineRole(email: string, walletAddress?: string): UserRole {
	if (isSuperAdminIdentifier(email)) return "superadmin";
	if (walletAddress && isSuperAdminIdentifier(walletAddress)) return "superadmin";
	return "learner";
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

type SanityClient = NonNullable<ReturnType<typeof getSanityClient>>;

async function cleanupDuplicateWalletUsers(
	client: SanityClient,
	keepId: string,
	walletAddress: string | undefined
) {
	if (!walletAddress) return;
	const duplicates = await client.fetch<Array<{ _id: string }>>(DUPLICATE_WALLET_USERS_QUERY, {
		walletAddress,
		keepId,
	});
	await deleteUsersByIds(
		client,
		duplicates.map((user) => user._id)
	);
}

async function patchAndCleanupByWallet(
	client: SanityClient,
	targetId: string,
	patch: Record<string, unknown>,
	walletAddress: string | undefined
) {
	await client.patch(targetId).set(patch).commit();
	await cleanupDuplicateWalletUsers(client, targetId, walletAddress);
}

export async function syncUserToSanity(params: SyncUserParams): Promise<AcademyUser | null> {
	const client = getSanityClient("write");
	if (!client) return null;

	const existing = await client.fetch<AcademyUser | null>(userByAuthIdQuery, {
		authId: params.authId,
	});
	const normalizedWalletAddress = params.walletAddress?.trim() ?? existing?.walletAddress?.trim();
	const roleFromIdentity = determineRole(params.email, normalizedWalletAddress);
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

	const buildExistingUserPatch = async (
		target: AcademyUser
	): Promise<Record<string, unknown>> => {
		const patch: Record<string, unknown> = {
			name: params.name,
			email: params.email,
			lastActiveAt: now,
			authId: params.authId,
			role: roleFromIdentity,
		};
		if (normalizedWalletAddress) patch.walletAddress = normalizedWalletAddress;
		if (params.image) patch.image = params.image;
		if (!target.username) patch.username = await generateUsername(params.name);
		return patch;
	};

	// Two different Sanity users found (one by authId, one by wallet): merge them
	if (existingByWallet && existing && existingByWallet._id !== existing._id) {
		const patch: Record<string, unknown> = {
			...(await buildExistingUserPatch(existingByWallet)),
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
		if (roleFromIdentity !== "learner") patch.role = roleFromIdentity;

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
		const patch = await buildExistingUserPatch(existingByWallet);
		await patchAndCleanupByWallet(client, existingByWallet._id, patch, normalizedWalletAddress);
		return { ...existingByWallet, ...patch } as AcademyUser;
	}

	// Found by authId: update in place
	if (existing) {
		const patch = await buildExistingUserPatch(existing);
		try {
			await patchAndCleanupByWallet(client, existing._id, patch, normalizedWalletAddress);
		} catch (err) {
			console.error("[sanity-users] Failed to patch user:", err);
		}
		return { ...existing, ...patch } as AcademyUser;
	}

	// Fallback: find by email when authId and wallet both miss (e.g., after auth DB reset)
	if (existingByEmail) {
		const patch = await buildExistingUserPatch(existingByEmail);
		await patchAndCleanupByWallet(client, existingByEmail._id, patch, normalizedWalletAddress);
		return { ...existingByEmail, ...patch } as AcademyUser;
	}

	const username = await generateUsername(params.name);
	const doc = {
		_type: "academyUser" as const,
		authId: params.authId,
		name: params.name,
		email: params.email,
		walletAddress: normalizedWalletAddress ?? "",
		image: params.image ?? "",
		username,
		role: roleFromIdentity,
		xpBalance: 0,
		enrolledCourses: [] as string[],
		completedCourses: [] as string[],
		savedCourses: [] as string[],
		lastActiveAt: now,
	};

	try {
		const created = await client.create(doc);
		await cleanupDuplicateWalletUsers(client, created._id as string, normalizedWalletAddress);
		return { ...doc, ...created } as unknown as AcademyUser;
	} catch (err) {
		console.error("[sanity-users] Failed to create user:", err);
		return null;
	}
}

export async function getUserByAuthId(authId: string): Promise<AcademyUser | null> {
	const client = getSanityClient("read");
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByAuthIdQuery, { authId });
}

export async function getUserByEmail(email: string): Promise<AcademyUser | null> {
	const client = getSanityClient("read");
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByEmailQuery, { email });
}

export async function getUserByWallet(walletAddress: string): Promise<AcademyUser | null> {
	const client = getSanityClient("read");
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByWalletQuery, { walletAddress });
}

export async function getUserByUsername(username: string): Promise<AcademyUser | null> {
	const client = getSanityClient("read");
	if (!client) return null;
	return client.fetch<AcademyUser | null>(userByUsernameQuery, { username });
}

export async function getAllUsers(limit = 100, offset = 0): Promise<AcademyUser[]> {
	const client = getSanityClient("read");
	if (!client) return [];
	const all = await client.fetch<AcademyUser[]>(allUsersQuery);
	return all.slice(offset, offset + limit);
}

export async function getAdminUsers(): Promise<AcademyUser[]> {
	const client = getSanityClient("read");
	if (!client) return [];
	return client.fetch<AcademyUser[]>(adminUsersQuery);
}

export async function getUserCount(): Promise<number> {
	const client = getSanityClient("read");
	if (!client) return 0;
	return client.fetch<number>(userCountQuery);
}

export async function getUserStats(): Promise<{
	totalUsers: number;
	activeUsers: number;
	adminCount: number;
	totalEnrollments: number;
}> {
	const client = getSanityClient("read");
	if (!client) return { totalUsers: 0, activeUsers: 0, adminCount: 0, totalEnrollments: 0 };
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	return client.fetch(userStatsQuery, { since: thirtyDaysAgo });
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
	const client = getSanityClient("write");
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
