import { createServerAuth, type ServerAuthConfig } from "@superteam/auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";

const authConfig: ServerAuthConfig = {
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
	githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
};

export const serverAuth = createServerAuth(authConfig);

const WALLET_EMAIL_DOMAIN = "wallet.superteam.local";

function isWalletEmail(email: string) {
	return email.endsWith(`@${WALLET_EMAIL_DOMAIN}`);
}

function extractWalletFromEmail(email: string) {
	if (!isWalletEmail(email)) {
		return undefined;
	}

	const candidate = email.slice(0, email.length - (`@${WALLET_EMAIL_DOMAIN}`).length);

	try {
		return new PublicKey(candidate).toBase58();
	} catch {
		return undefined;
	}
}

export async function issueWalletBetterAuthSession(request: NextRequest, publicKey: string) {
	const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
	if (!authSecret) {
		throw new Error("BETTER_AUTH_SECRET or AUTH_SECRET is required for wallet auth");
	}

	const endpointHeaders = new Headers(request.headers);

	return serverAuth.api.signInWallet({
		body: {
			publicKey,
			rememberMe: true,
			internalAuthToken: `wallet:${authSecret}`,
		},
		request,
		headers: endpointHeaders,
		returnHeaders: true,
	});
}

export async function getLinkedWallet() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({
		headers: requestHeaders,
	});

	if (!session) {
		return undefined;
	}

	return extractWalletFromEmail(session.user.email);
}
