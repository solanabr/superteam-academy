/**
 * @fileoverview Better Auth server-side configuration.
 * Defines the authentication engine, user schema extensions, and custom Solana plugin endpoints.
 */

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { multiSession } from "better-auth/plugins/multi-session";
import bs58 from "bs58";
import crypto from "crypto";
import nacl from "tweetnacl";
import { connection, getConfigPda } from "../anchor/client";
import { OnchainAcademy } from "../anchor/idl/onchain_academy";
import IDL_JSON from "../anchor/idl/onchain_academy.json";
import { db } from "../db";
import { wallet as walletTable } from "../db/schema";

const IDL = IDL_JSON as OnchainAcademy;

/**
 * The core authentication server instance.
 * Handles database persistence via Drizzle and implements the Solana sign-in/link flow.
 */
export const auth = betterAuth({
	trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(","),
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const adminEmails = (process.env.ADMIN_EMAILS || "").split(",");
					if (adminEmails.includes(user.email)) {
						return {
							data: {
								...user,
								role: "admin",
							},
						};
					}
				},
			},
		},
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "learner",
			},
			bio: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			location: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			github: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			twitter: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			website: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			language: {
				type: "string",
				required: false,
				defaultValue: "en",
			},
			publicVisibility: {
				type: "boolean",
				required: false,
				defaultValue: true,
			},
			notifications: {
				type: "string",
				required: false,
				defaultValue: JSON.stringify({
					newCourses: true,
					leaderboardAlerts: false,
					directMessages: true,
				}),
			},
			onboardingCompleted: {
				type: "boolean",
				required: false,
				defaultValue: false,
			},
			preferredTracks: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			avatarSeed: {
				type: "string",
				required: false,
				defaultValue: null,
			},
			walletAddress: {
				type: "string",
				required: false,
				defaultValue: null,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID || "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	plugins: [
		multiSession(),
		// Custom Solana Credentials plugin
		{
			id: "solana",
			endpoints: {
				/**
				 * Endpoint for Solana wallet sign-in.
				 * Verifies signature and creates/reconciles user session.
				 */
				signInSolana: createAuthEndpoint(
					"/sign-in/solana",
					{
						method: "POST",
					},
					async (ctx) => {
						try {
							// BetterAuth consumes the request body stream, so ctx.request.json()
							// will fail. We need to get the body from ctx.body (populated by BA)
							// or parse it ourselves from the raw request.
							let publicKey: string | undefined;
							let signature: string | undefined;
							let message: string | undefined;

							const body = ctx.body as {
								publicKey?: string;
								signature?: string;
								message?: string;
							};
							if (body) {
								publicKey = body.publicKey;
								signature = body.signature;
								message = body.message;
							} else if (ctx.request) {
								// Fallback: try to clone and parse
								try {
									const parsed = await ctx.request.clone().json();
									publicKey = parsed.publicKey;
									signature = parsed.signature;
									message = parsed.message;
								} catch {
									return new Response(
										JSON.stringify({ error: "Failed to parse request body" }),
										{ status: 400 },
									);
								}
							} else {
								return new Response(
									JSON.stringify({ error: "No request body" }),
									{ status: 400 },
								);
							}

							if (!publicKey || !signature || !message) {
								return new Response(
									JSON.stringify({ error: "Missing parameters" }),
									{ status: 400 },
								);
							}

							// Verify the signature
							const signatureUint8 = bs58.decode(signature!);
							const messageUint8 = new TextEncoder().encode(message!);
							const pubKeyUint8 = bs58.decode(publicKey!);

							const isValid = nacl.sign.detached.verify(
								messageUint8,
								signatureUint8,
								pubKeyUint8,
							);

							if (!isValid) {
								return new Response(
									JSON.stringify({ error: "Invalid signature" }),
									{ status: 401 },
								);
							}

							// Upsert User
							let userParams = undefined;

							// 1. Check if the wallet exists in our dedicated wallet table
							const existingWallet = await db.query.wallet.findFirst({
								where: (w, { eq }) => eq(w.address, publicKey),
							});

							if (existingWallet && existingWallet.userId) {
								const existingUser = await db.query.user.findFirst({
									where: (users, { eq }) => eq(users.id, existingWallet.userId),
								});
								if (existingUser) {
									userParams = existingUser;
								}
							}

							// 2. Check if the account exists in BetterAuth's account table
							if (!userParams) {
								const existingAccount = await db.query.account.findFirst({
									where: (accounts, { eq, and }) =>
										and(
											eq(accounts.providerId, "solana"),
											eq(accounts.accountId, publicKey),
										),
								});

								if (existingAccount) {
									const existingUser = await db.query.user.findFirst({
										where: (users, { eq }) =>
											eq(users.id, existingAccount.userId),
									});
									if (existingUser) {
										userParams = existingUser;
									}
								}
							}

							// 3. Fallback: Check by walletAddress field on user table
							if (!userParams) {
								const existingUser = await db.query.user.findFirst({
									where: (users, { eq }) => eq(users.walletAddress, publicKey),
								});
								if (existingUser) {
									userParams = existingUser;
								}
							}

							// 4. Fallback: Check if user exists with ID = publicKey (old behavior)
							if (!userParams) {
								const existingUser = await db.query.user.findFirst({
									where: (users, { eq }) => eq(users.id, publicKey),
								});
								if (existingUser) {
									userParams = existingUser;
								}
							}

							if (!userParams) {
								if (!publicKey) {
									return new Response(
										JSON.stringify({
											error: "Missing public key for user creation",
										}),
										{ status: 400 },
									);
								}
								// Determine role based on environment variables
								const adminWallets = (process.env.ADMIN_WALLETS || "").split(
									",",
								);
								const adminEmails = (process.env.ADMIN_EMAILS || "").split(",");

								let role = "learner";

								// Official On-Chain Authority Check
								try {
									const [configPda] = getConfigPda();
									const provider = new AnchorProvider(
										connection,
										{} as unknown as import("@coral-xyz/anchor").Wallet,
										AnchorProvider.defaultOptions(),
									);
									const program = new Program<OnchainAcademy>(IDL, provider);
									const config = await program.account.config.fetch(configPda);

									if (publicKey && config.authority.toBase58() === publicKey) {
										role = "admin";
										console.log(
											`[Auth] Authority detected on-chain for ${publicKey}. Granting admin role.`,
										);
									}
								} catch (e) {
									console.error(
										"[Auth] Failed to fetch on-chain config for role check:",
										e instanceof Error ? e.message : String(e),
									);
								}

								// Fallback/Manual Overrides
								if (role !== "admin") {
									if (publicKey && adminWallets.includes(publicKey)) {
										role = "admin";
									} else if (
										adminEmails.includes(`${publicKey}@solana.local`)
									) {
										role = "admin";
									}
								}

								// Create new user linked to this pubkey
								const newUser = await ctx.context.internalAdapter.createUser({
									name: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
									email: `${publicKey}@solana.local`,
									emailVerified: true,
									role: role,
									avatarSeed: Math.random().toString(36).substring(2, 15),
									walletAddress: publicKey,
									createdAt: new Date(),
									updatedAt: new Date(),
								});
								userParams = newUser;

								// Populate new wallet table
								await db.insert(walletTable).values({
									id: crypto.randomUUID(),
									address: publicKey,
									userId: userParams.id,
									provider: "solana",
									isPrimary: true,
									createdAt: new Date(),
									updatedAt: new Date(),
								});

								// Create initial account record for Solana
								await ctx.context.internalAdapter.createAccount({
									userId: userParams.id,
									providerId: "solana",
									accountId: publicKey,
									createdAt: new Date(),
									updatedAt: new Date(),
								});
							} else {
								// Existing user — ensure walletAddress is saved to user record
								if (!userParams.walletAddress) {
									await ctx.context.internalAdapter.updateUser(userParams.id, {
										walletAddress: publicKey,
									});
									userParams = { ...userParams, walletAddress: publicKey };
								}

								// Ensure wallet table record exists
								const walletRecordExists = await db.query.wallet.findFirst({
									where: (w, { eq }) => eq(w.address, publicKey),
								});
								if (!walletRecordExists) {
									await db.insert(walletTable).values({
										id: crypto.randomUUID(),
										address: publicKey,
										userId: userParams.id,
										provider: "solana",
										isPrimary: true,
										createdAt: new Date(),
										updatedAt: new Date(),
									});
								}
							}

							// Create session
							const session = await ctx.context.internalAdapter.createSession(
								userParams.id,
							);

							// Use BetterAuth's official setSessionCookie
							await setSessionCookie(ctx, {
								session,
								user: userParams,
							});

							return ctx.json({ user: userParams, session });
						} catch (error) {
							return new Response(
								JSON.stringify({
									error: "Authentication failed",
									details:
										error instanceof Error ? error.message : String(error),
								}),
								{ status: 500 },
							);
						}
					},
				),
				/**
				 * Endpoint to link a Solana wallet to an existing account.
				 */
				linkSolana: createAuthEndpoint(
					"/link/solana",
					{
						method: "POST",
						use: [sessionMiddleware],
					},
					async (ctx) => {
						if (!ctx.request) {
							return new Response(JSON.stringify({ error: "No request" }), {
								status: 400,
							});
						}

						const body = (await ctx.request.json()) as {
							publicKey: string;
							signature: string;
							message: string;
						};
						const { publicKey, signature, message } = body;

						if (!publicKey || !signature || !message) {
							return new Response(
								JSON.stringify({ error: "Missing parameters" }),
								{ status: 400 },
							);
						}

						try {
							// Verify the signature
							const signatureUint8 = bs58.decode(signature);
							const messageUint8 = new TextEncoder().encode(message);
							const pubKeyUint8 = bs58.decode(publicKey);

							const isValid = nacl.sign.detached.verify(
								messageUint8,
								signatureUint8,
								pubKeyUint8,
							);

							if (!isValid) {
								return new Response(
									JSON.stringify({ error: "Invalid signature" }),
									{ status: 401 },
								);
							}

							// Ensure user is logged in
							const currentSession = ctx.context.session;

							if (!currentSession) {
								return new Response(
									JSON.stringify({ error: "Not authenticated" }),
									{ status: 401 },
								);
							}

							const userId = currentSession.session.userId;

							if (!userId) {
								return new Response(
									JSON.stringify({ error: "Invalid session structure" }),
									{ status: 401 },
								);
							}

							const existingWallet = await db.query.wallet.findFirst({
								where: (wallets, { eq, and, ne }) =>
									and(
										eq(wallets.address, publicKey),
										ne(wallets.userId, userId),
									),
							});

							if (existingWallet) {
								return new Response(
									JSON.stringify({
										error: "Wallet already linked to another account",
									}),
									{ status: 400 },
								);
							}

							// 2. Link in Better Auth accounts table (if not already linked)
							try {
								const existingAccount = await db.query.account.findFirst({
									where: (accounts, { eq, and }) =>
										and(
											eq(accounts.providerId, "solana"),
											eq(accounts.accountId, publicKey),
										),
								});

								if (!existingAccount) {
									await ctx.context.internalAdapter.createAccount({
										userId: userId,
										providerId: "solana",
										accountId: publicKey,
										createdAt: new Date(),
										updatedAt: new Date(),
									});
								}
							} catch (e) {
								console.error("Account linking error (non-fatal):", e);
								// We continue because we still want to record it in our wallet table
							}

							// 3. Update user table with primary wallet if not set
							const currentUser = await db.query.user.findFirst({
								where: (users, { eq }) => eq(users.id, userId),
							});

							if (currentUser && !currentUser.walletAddress) {
								await ctx.context.internalAdapter.updateUser(userId, {
									walletAddress: publicKey,
								});
							}

							// 4. Populate/Update our dedicated wallet table
							await db
								.insert(walletTable)
								.values({
									id: crypto.randomUUID(),
									address: publicKey,
									userId: userId,
									provider: "solana",
									isPrimary: !currentUser?.walletAddress,
									createdAt: new Date(),
									updatedAt: new Date(),
								})
								.onConflictDoUpdate({
									target: [walletTable.address],
									set: {
										userId: userId,
										updatedAt: new Date(),
									},
								});

							return new Response(JSON.stringify({ success: true }), {
								status: 200,
							});
						} catch (error) {
							return new Response(
								JSON.stringify({
									error:
										error instanceof Error ? error.message : "Linking failed",
								}),
								{ status: 500 },
							);
						}
					},
				),
			},
		},
	],
});
