import { createSanityClient } from "@superteam-academy/cms";
import type { LinkedAccountRecord, LinkedAccountProvider } from "@superteam-academy/cms";

type AcademyUserLinkingDoc = {
	_id: string;
	authId: string;
	walletAddress?: string;
	linkedAccounts?: LinkedAccountRecord[];
};

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

function normalizeIdentifier(identifier: string): string {
	return identifier.trim().toLowerCase();
}

export async function getLinkedAccountsForUser(userId: string): Promise<LinkedAccountRecord[]> {
	const client = sanityReadClient();
	if (!client) return [];

	const user = await client.fetch<Pick<AcademyUserLinkingDoc, "linkedAccounts"> | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ linkedAccounts }`,
		{ authId: userId }
	);

	return user?.linkedAccounts ?? [];
}

export async function findLinkedUserId(
	provider: LinkedAccountProvider,
	identifier: string
): Promise<string | undefined> {
	const normalizedIdentifier = normalizeIdentifier(identifier);
	const client = sanityReadClient();
	if (!client) return undefined;

	const result = await client.fetch<{ authId: string } | null>(
		provider === "wallet"
			? `*[_type == "academyUser" && (walletAddress == $identifier || count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0)][0]{ authId }`
			: `*[_type == "academyUser" && count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0][0]{ authId }`,
		{ provider, identifier: identifier.trim(), normalized: normalizedIdentifier }
	);

	return result?.authId;
}

export async function upsertLinkedAccount(params: {
	userId: string;
	provider: LinkedAccountProvider;
	identifier: string;
}): Promise<
	| { linked: true }
	| { linked: false; reason: "storage-unavailable" | "linked-to-different-user" | "user-not-found" }
> {
	const normalizedIdentifier = normalizeIdentifier(params.identifier);
	const client = sanityWriteClient();
	if (!client) {
		return { linked: false, reason: "storage-unavailable" };
	}

	const currentUser = await client.fetch<AcademyUserLinkingDoc | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ _id, authId, walletAddress, linkedAccounts }`,
		{ authId: params.userId }
	);

	if (!currentUser) {
		return { linked: false, reason: "user-not-found" };
	}

	const conflict = await client.fetch<{ _id: string } | null>(
		params.provider === "wallet"
			? `*[_type == "academyUser" && authId != $authId && (walletAddress == $identifier || count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0)][0]{ _id }`
			: `*[_type == "academyUser" && authId != $authId && count(linkedAccounts[provider == $provider && lower(identifier) == $normalized]) > 0][0]{ _id }`,
		{
			authId: params.userId,
			provider: params.provider,
			identifier: params.identifier.trim(),
			normalized: normalizedIdentifier,
		}
	);

	if (conflict) {
		return { linked: false, reason: "linked-to-different-user" };
	}

	const accounts = currentUser.linkedAccounts ?? [];
	const now = new Date().toISOString();
	const withoutProvider = accounts.filter((account) => account.provider !== params.provider);
	const nextLinkedAccounts: LinkedAccountRecord[] = [
		...withoutProvider,
		{
			provider: params.provider,
			identifier: params.identifier.trim(),
			linkedAt: now,
		},
	];

	const patch: Record<string, unknown> = {
		linkedAccounts: nextLinkedAccounts,
	};

	if (params.provider === "wallet") {
		patch.walletAddress = params.identifier.trim();
	}

	await client.patch(currentUser._id).set(patch).commit();
	return { linked: true };
}

export async function unlinkLinkedAccount(params: {
	userId: string;
	provider: LinkedAccountProvider;
}): Promise<boolean> {
	const client = sanityWriteClient();
	if (!client) return false;

	const currentUser = await client.fetch<AcademyUserLinkingDoc | null>(
		`*[_type == "academyUser" && authId == $authId][0]{ _id, linkedAccounts }`,
		{ authId: params.userId }
	);

	if (!currentUser) return false;

	const accounts = currentUser.linkedAccounts ?? [];
	const filtered = accounts.filter((account) => account.provider !== params.provider);

	if (filtered.length === accounts.length) {
		return false;
	}

	const patch: Record<string, unknown> = {
		linkedAccounts: filtered,
	};

	if (params.provider === "wallet") {
		patch.walletAddress = "";
	}

	await client.patch(currentUser._id).set(patch).commit();
	return true;
}