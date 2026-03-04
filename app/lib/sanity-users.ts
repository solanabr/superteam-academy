import type { AcademyUser, UserRole } from "@superteam-academy/cms";
import { readClient, writeClient } from "@/lib/cms-context";
import {
	userByAuthIdQuery,
	userByEmailQuery,
	userByWalletQuery,
	userByUsernameQuery,
	allUsersQuery,
	adminUsersQuery,
	userStatsQuery,
} from "@superteam-academy/cms/queries";
import { generateUsername } from "./username-utils";
import { WALLET_EMAIL_DOMAIN, walletEmail } from "@/packages/auth/src/wallet-utils";
import { truncateAddress } from "@/lib/utils";

export type { AcademyUser };

const DUPLICATE_WALLET_USERS_QUERY = `*[_type == "academyUser" && walletAddress == $walletAddress && _id != $keepId]{ _id }`;
const DUPLICATE_WALLET_EMAIL_USERS_QUERY = `*[_type == "academyUser" && _id != $keepId && lower(email) == $walletEmailLower]{ _id }`;

type SyncUserParams = {
	authId: string;
	name: string;
	email: string;
	walletAddress?: string;
	image?: string;
};

function isSuperAdminIdentifier(emailOrWallet: string): boolean {
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

async function deleteUsersByIds(client: NonNullable<typeof writeClient>, ids: string[]) {
	for (const id of ids) {
		try {
			await client.delete(id);
		} catch (err) {
			console.error("[sanity-users] Failed to delete duplicate user:", id, err);
		}
	}
}

async function cleanupDuplicateWalletUsers(
	client: NonNullable<typeof writeClient>,
	keepId: string,
	walletAddress: string | undefined
) {
	if (!walletAddress) return;
	const duplicates = await client.fetch<Array<{ _id: string }>>(DUPLICATE_WALLET_USERS_QUERY, {
		walletAddress,
		keepId,
	});
	const walletEmailLower = walletEmail(walletAddress).toLowerCase();
	const emailGhosts = await client.fetch<Array<{ _id: string }>>(DUPLICATE_WALLET_EMAIL_USERS_QUERY, {
		walletEmailLower,
		keepId,
	});
	const allIds = [...new Set([...duplicates, ...emailGhosts].map((u) => u._id))];
	await deleteUsersByIds(client, allIds);
}

async function patchAndCleanupByWallet(
	client: NonNullable<typeof writeClient>,
	targetId: string,
	patch: Record<string, unknown>,
	walletAddress: string | undefined
) {
	await client.patch(targetId).set(patch).commit();
	await cleanupDuplicateWalletUsers(client, targetId, walletAddress);
}

export async function syncUserToSanity(params: SyncUserParams): Promise<AcademyUser | null> {
	if (!writeClient) return null;

	const existing = await writeClient.fetch<AcademyUser | null>(userByAuthIdQuery, {
		authId: params.authId,
	});
	const normalizedWalletAddress = params.walletAddress?.trim() || existing?.walletAddress?.trim();
	const roleFromIdentity = determineRole(params.email, normalizedWalletAddress);
	const existingByWallet = normalizedWalletAddress
		? await writeClient.fetch<AcademyUser | null>(userByWalletQuery, {
				walletAddress: normalizedWalletAddress,
			})
		: null;
	const existingByEmail =
		!existing && !existingByWallet
			? await writeClient.fetch<AcademyUser | null>(userByEmailQuery, { email: params.email })
			: null;

	const now = new Date().toISOString();

	const buildExistingUserPatch = async (
		target: AcademyUser
	): Promise<Record<string, unknown>> => {
		const patch: Record<string, unknown> = {
			name: params.name,
			email: params.email,
			walletAddress: normalizedWalletAddress || target.walletAddress || "",
			lastActiveAt: now,
			authId: params.authId,
			role: roleFromIdentity,
		};
		if (params.image) patch.image = params.image;
		if (!target.username) patch.username = await generateUsername(params.name);
		return patch;
	};

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

		await writeClient.patch(existingByWallet._id).set(patch).commit();
		await deleteUsersByIds(writeClient, [existing._id]);
		await patchAndCleanupByWallet(
			writeClient,
			existingByWallet._id,
			{},
			normalizedWalletAddress
		);

		return { ...existingByWallet, ...patch } as AcademyUser;
	}

	if (!existing && existingByWallet) {
		const patch = await buildExistingUserPatch(existingByWallet);
		await patchAndCleanupByWallet(
			writeClient,
			existingByWallet._id,
			patch,
			normalizedWalletAddress
		);
		return { ...existingByWallet, ...patch } as AcademyUser;
	}

	if (existing) {
		const patch = await buildExistingUserPatch(existing);
		try {
			await patchAndCleanupByWallet(
				writeClient,
				existing._id,
				patch,
				normalizedWalletAddress
			);
		} catch (err) {
			console.error("[sanity-users] Failed to patch user:", err);
		}
		return { ...existing, ...patch } as AcademyUser;
	}

	if (existingByEmail) {
		const patch = await buildExistingUserPatch(existingByEmail);
		await patchAndCleanupByWallet(
			writeClient,
			existingByEmail._id,
			patch,
			normalizedWalletAddress
		);
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
		const created = await writeClient.create(doc);
		await cleanupDuplicateWalletUsers(
			writeClient,
			created._id as string,
			normalizedWalletAddress
		);
		return { ...doc, ...created } as unknown as AcademyUser;
	} catch (err) {
		console.error("[sanity-users] Failed to create user:", err);
		return null;
	}
}

export async function getUserByAuthId(authId: string): Promise<AcademyUser | null> {
	if (!readClient) return null;
	return readClient.fetch<AcademyUser | null>(userByAuthIdQuery, { authId });
}

export async function getUserByWallet(walletAddress: string): Promise<AcademyUser | null> {
	if (!readClient) return null;
	return readClient.fetch<AcademyUser | null>(userByWalletQuery, { walletAddress });
}

export async function getUserByUsername(username: string): Promise<AcademyUser | null> {
	if (!readClient) return null;
	return readClient.fetch<AcademyUser | null>(userByUsernameQuery, { username });
}

export async function getAllUsers(limit = 100, offset = 0): Promise<AcademyUser[]> {
	if (!readClient) return [];
	const all = await readClient.fetch<AcademyUser[]>(allUsersQuery);
	return all.slice(offset, offset + limit);
}

export async function getAdminUsers(): Promise<AcademyUser[]> {
	if (!readClient) return [];
	return readClient.fetch<AcademyUser[]>(adminUsersQuery);
}

export async function getUserStats(): Promise<{
	totalUsers: number;
	activeUsers: number;
	adminCount: number;
	totalEnrollments: number;
}> {
	if (!readClient) return { totalUsers: 0, activeUsers: 0, adminCount: 0, totalEnrollments: 0 };
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	return readClient.fetch(userStatsQuery, { since: thirtyDaysAgo });
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
	if (!writeClient) return false;

	const user = await writeClient.fetch<AcademyUser | null>(
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

	await writeClient.patch(userId).set({ role }).commit();
	return true;
}

const USERS_BY_WALLETS_QUERY = `*[_type == "academyUser" && walletAddress in $wallets]{ _id, name, image, walletAddress, location }`;
const ALL_USER_WALLETS_QUERY = `*[_type == "academyUser" && defined(walletAddress) && walletAddress != ""].walletAddress`;

export async function getAllUserWallets(): Promise<string[]> {
	if (!readClient) return [];
	return readClient.fetch<string[]>(ALL_USER_WALLETS_QUERY);
}

export async function ensureSanityUsersExist(wallets: string[]): Promise<void> {
	if (!writeClient || wallets.length === 0) return;
	const existing = await getUsersByWallets(wallets);
	const missing = wallets.filter((w) => !existing.has(w));
	if (missing.length === 0) return;

	const now = new Date().toISOString();
	const transaction = writeClient.transaction();
	for (const wallet of missing) {
		transaction.create({
			_type: "academyUser" as const,
			authId: "",
			name: truncateAddress(wallet),
			email: "",
			walletAddress: wallet,
			role: "learner" as const,
			xpBalance: 0,
			enrolledCourses: [] as string[],
			completedCourses: [] as string[],
			savedCourses: [] as string[],
			lastActiveAt: now,
		});
	}
	await transaction.commit().catch(() => {
		/* ignore write failures */
	});
}

export async function getUsersByWallets(
	wallets: string[]
): Promise<
	Map<string, Pick<AcademyUser, "name" | "image" | "walletAddress"> & { location?: string }>
> {
	const map = new Map<
		string,
		Pick<AcademyUser, "name" | "image" | "walletAddress"> & { location?: string }
	>();
	if (!readClient || wallets.length === 0) return map;
	const results = await readClient.fetch<
		Array<{
			_id: string;
			name: string;
			image?: string;
			walletAddress: string;
			location?: string;
		}>
	>(USERS_BY_WALLETS_QUERY, { wallets });
	for (const u of results) {
		if (u.walletAddress) map.set(u.walletAddress, u);
	}
	return map;
}
