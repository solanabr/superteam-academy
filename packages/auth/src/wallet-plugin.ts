import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import type { AuthContext } from "better-auth";
import { APIError } from "better-call";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const WALLET_PROVIDER_ID = "wallet";
const WALLET_EMAIL_DOMAIN = "wallet.superteam.local";

function walletDisplayName(publicKey: string) {
	return `Wallet ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
}

function walletEmail(publicKey: string) {
	return `${publicKey}@${WALLET_EMAIL_DOMAIN}`;
}

function toPublicUser(user: {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null | undefined;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		image: user.image ?? null,
		emailVerified: user.emailVerified,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

async function findOrCreateWalletUser(ctx: AuthContext, publicKey: string) {
	const existingAccount = await ctx.internalAdapter.findAccountByProviderId(
		publicKey,
		WALLET_PROVIDER_ID
	);

	if (existingAccount) {
		const existingUser = await ctx.internalAdapter.findUserById(existingAccount.userId);
		if (!existingUser) {
			throw new Error("Wallet account exists without linked user");
		}
		return existingUser;
	}

	const user = await ctx.internalAdapter.createUser({
		name: walletDisplayName(publicKey),
		email: walletEmail(publicKey),
		emailVerified: true,
	});

	await ctx.internalAdapter.createAccount({
		providerId: WALLET_PROVIDER_ID,
		accountId: publicKey,
		userId: user.id,
	});

	return user;
}

export function walletAuthPlugin() {
	return {
		id: "wallet-auth",
		endpoints: {
			signInWallet: createAuthEndpoint(
				"/sign-in/wallet",
				{
					method: "POST",
					body: z.object({
						publicKey: z.string().min(32).max(64),
						rememberMe: z.boolean().optional(),
						internalAuthToken: z.string().min(1),
					}),
				},
				async (ctx) => {
					if (ctx.body.internalAuthToken !== `wallet:${ctx.context.secret}`) {
						throw new APIError("UNAUTHORIZED", {
							message: "Unauthorized wallet sign-in invocation",
						});
					}

					let normalizedPublicKey: string;
					try {
						normalizedPublicKey = new PublicKey(ctx.body.publicKey).toBase58();
					} catch {
						throw new APIError("BAD_REQUEST", {
							message: "Invalid wallet public key",
						});
					}

					if (
						ctx.context.session &&
						ctx.context.session.user.email === walletEmail(normalizedPublicKey)
					) {
						return {
							token: ctx.context.session.session.token,
							user: toPublicUser(ctx.context.session.user),
						};
					}

					const user = await findOrCreateWalletUser(ctx.context, normalizedPublicKey);

					const session = await ctx.context.internalAdapter.createSession(
						user.id,
						!ctx.body.rememberMe
					);

					await setSessionCookie(ctx, { session, user }, !ctx.body.rememberMe);

					return {
						token: session.token,
						user: toPublicUser(user),
					};
				}
			),
		},
	} as const;
}
