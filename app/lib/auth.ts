import { createServerAuth, type ServerAuthConfig } from "@superteam-academy/auth";
import { walletFromEmail } from "@superteam-academy/auth";
import { PublicKey } from "@solana/web3.js";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

const authConfig: ServerAuthConfig = {
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
	githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
};

export const serverAuth = createServerAuth(authConfig);

function getAuthSecret(): string {
	const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
	if (!secret) throw new Error("BETTER_AUTH_SECRET or AUTH_SECRET is required for wallet auth");
	return secret;
}

export async function issueWalletBetterAuthSession(request: NextRequest, publicKey: string) {
	return serverAuth.api.signInWallet({
		body: {
			publicKey,
			rememberMe: true,
			internalAuthToken: `wallet:${getAuthSecret()}`,
		},
		request,
		headers: new Headers(request.headers),
		returnHeaders: true,
	});
}

export async function issueLinkedWalletBetterAuthSession(
	request: NextRequest,
	publicKey: string,
	userId: string
) {
	return serverAuth.api.signInLinkedWallet({
		body: {
			publicKey,
			userId,
			rememberMe: true,
			internalAuthToken: `wallet:${getAuthSecret()}`,
		},
		request,
		headers: new Headers(request.headers),
		returnHeaders: true,
	});
}

export async function getLinkedWallet() {
	const requestHeaders = await headers();

	if (process.env.NODE_ENV === "test") {
		const testWallet = requestHeaders.get("x-test-wallet");
		if (testWallet) {
			try {
				return new PublicKey(testWallet).toBase58();
			} catch {
				return undefined;
			}
		}
	}

	const session = await serverAuth.api.getSession({
		headers: requestHeaders,
	});

	if (!session) return undefined;

	// Wallet-only sessions have the pubkey encoded in the email
	const fromEmail = walletFromEmail(session.user.email);
	if (fromEmail) return fromEmail;

	// OAuth users who linked a wallet have it stored on the user record
	const stored = (session.user as Record<string, unknown>).walletAddress as string | undefined;
	if (stored) {
		try {
			return new PublicKey(stored).toBase58();
		} catch {
			return undefined;
		}
	}

	return undefined;
}
