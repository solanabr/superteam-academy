import type { LinkedAccountRecord, LinkedAccountProvider } from "@superteam-academy/cms";
import { readClient, writeClient } from "@/lib/cms-context";

type AcademyUserLinkingDoc = {
	_id: string;
	authId: string;
	walletAddress?: string;
	linkedAccounts?: LinkedAccountRecord[];
};

export async function getLinkedAccountsForUser(userId: string): Promise<LinkedAccountRecord[]> {
	if (!readClient) return [];

	const user = await readClient.fetch<Pick<AcademyUserLinkingDoc, "linkedAccounts"> | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ linkedAccounts }`,
		{ authId: userId }
	);

	return user?.linkedAccounts ?? [];
}

export async function findLinkedUserId(
	provider: LinkedAccountProvider,
	identifier: string
): Promise<string | undefined> {
	const normalized = identifier.trim().toLowerCase();
	if (!readClient) return undefined;

	const result = await readClient.fetch<{ authId: string } | null>(
		provider === "wallet"
			? `*[_type == "academyUser" && (walletAddress == $identifier || count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0)][0]{ authId }`
			: `*[_type == "academyUser" && count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0][0]{ authId }`,
		{ provider, identifier: identifier.trim(), normalized }
	);

	return result?.authId;
}

export async function upsertLinkedAccount(params: {
	userId: string;
	provider: LinkedAccountProvider;
	identifier: string;
}): Promise<
	| { linked: true }
	| {
			linked: false;
			reason: "storage-unavailable" | "linked-to-different-user" | "user-not-found";
	  }
> {
	const normalized = params.identifier.trim().toLowerCase();
	if (!writeClient) {
		return { linked: false, reason: "storage-unavailable" };
	}

	const currentUser = await writeClient.fetch<AcademyUserLinkingDoc | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ _id, authId, walletAddress, linkedAccounts }`,
		{ authId: params.userId }
	);

	if (!currentUser) {
		return { linked: false, reason: "user-not-found" };
	}

	const conflict = await writeClient.fetch<{ _id: string } | null>(
		params.provider === "wallet"
			? `*[_type == "academyUser" && authId != $authId && (walletAddress == $identifier || count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0)][0]{ _id }`
			: `*[_type == "academyUser" && authId != $authId && count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0][0]{ _id }`,
		{
			authId: params.userId,
			provider: params.provider,
			identifier: params.identifier.trim(),
			normalized,
		}
	);

	if (conflict) {
		return { linked: false, reason: "linked-to-different-user" };
	}

	const accounts = currentUser.linkedAccounts ?? [];
	const withoutProvider = accounts.filter((account) => account.provider !== params.provider);
	const nextLinkedAccounts: LinkedAccountRecord[] = [
		...withoutProvider,
		{
			provider: params.provider,
			identifier: params.identifier.trim(),
			linkedAt: new Date().toISOString(),
		},
	];

	const patch: Record<string, unknown> = { linkedAccounts: nextLinkedAccounts };
	if (params.provider === "wallet") {
		patch.walletAddress = params.identifier.trim();
	}

	await writeClient.patch(currentUser._id).set(patch).commit();
	return { linked: true };
}

export async function unlinkLinkedAccount(params: {
	userId: string;
	provider: LinkedAccountProvider;
}): Promise<boolean> {
	if (!writeClient) return false;

	const currentUser = await writeClient.fetch<AcademyUserLinkingDoc | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ _id, linkedAccounts }`,
		{ authId: params.userId }
	);

	if (!currentUser) return false;

	const accounts = currentUser.linkedAccounts ?? [];
	const filtered = accounts.filter((account) => account.provider !== params.provider);
	if (filtered.length === accounts.length) return false;

	const patch: Record<string, unknown> = { linkedAccounts: filtered };
	if (params.provider === "wallet") {
		patch.walletAddress = "";
	}

	await writeClient.patch(currentUser._id).set(patch).commit();
	return true;
}

export type { LinkedAccountProvider };
