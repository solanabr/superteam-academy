import { createSanityClient } from "@superteam/cms";
import type { AcademyUser, UserRole } from "@superteam/cms";
import {
	userByAuthIdQuery,
	userByEmailQuery,
	userByWalletQuery,
	allUsersQuery,
	adminUsersQuery,
	userStatsQuery,
	userCountQuery,
} from "@superteam/cms/queries";

function sanityWriteClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
}

function sanityReadClient() {
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) return null;
	return createSanityClient({ projectId, dataset, token, useCdn: false });
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

export async function syncUserToSanity(params: {
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	image?: string;
}): Promise<AcademyUser | null> {
	const client = sanityWriteClient();
	if (!client) return null;

	const existing = await client.fetch<AcademyUser | null>(userByAuthIdQuery, {
		authId: params.authId,
	});

	const now = new Date().toISOString();

	if (existing) {
		const patch: Record<string, unknown> = {
			name: params.name,
			lastActiveAt: now,
		};
		if (params.walletAddress && !existing.walletAddress) {
			patch.walletAddress = params.walletAddress;
		}
		if (params.image) {
			patch.image = params.image;
		}
		// Promote to superadmin if env matches
		if (existing.role === "learner") {
			const newRole = determineRole(params.email, params.walletAddress);
			if (newRole !== "learner") {
				patch.role = newRole;
			}
		}
		try {
			await client.patch(existing._id).set(patch).commit();
		} catch (err) {
			console.error("[sanity-users] Failed to patch user:", err);
		}
		return { ...existing, ...patch } as AcademyUser;
	}

	const role = determineRole(params.email, params.walletAddress);
	const doc = {
		_type: "academyUser" as const,
		authId: params.authId,
		name: params.name,
		email: params.email,
		walletAddress: params.walletAddress ?? "",
		image: params.image ?? "",
		role,
		xpBalance: 0,
		enrolledCourses: [] as string[],
		completedCourses: [] as string[],
		lastActiveAt: now,
	};

	try {
		const created = await client.create(doc);
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
