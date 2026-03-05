/**
 * @fileoverview Wallet authentication route handler.
 * Manages Solana wallet signature verification, user account reconciliation,
 * and session creation via BetterAuth.
 */
import bs58 from "bs58";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userSchema, wallet as walletTable } from "@/lib/db/schema";

/**
 * POST handler for wallet-based authentication.
 *
 * Flow:
 * 1. Verifies the Solana 'detached' signature.
 * 2. Matches the public key against existing users (OAuth/Email/Wallet).
 * 3. Creates a new user if no match is found.
 * 4. Programmatically signs the user into a BetterAuth session.
 *
 * @param req The incoming NextRequest containing {publicKey, signature, message}.
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { publicKey, signature, message } = body;

		if (!publicKey || !signature || !message) {
			return NextResponse.json(
				{ error: "Missing parameters" },
				{ status: 400 },
			);
		}

		// 1. Verify the signature
		// We use tweetnacl to verify that the 'message' was signed by the 'publicKey'
		const signatureUint8 = bs58.decode(signature);
		const messageUint8 = new TextEncoder().encode(message);
		const pubKeyUint8 = bs58.decode(publicKey);

		const isValid = nacl.sign.detached.verify(
			messageUint8,
			signatureUint8,
			pubKeyUint8,
		);

		if (!isValid) {
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		// 2. Find existing user by wallet address
		let userId: string | null = null;

		// Check wallet table
		const existingWallet = await db.query.wallet.findFirst({
			where: (w, { eq }) => eq(w.address, publicKey),
		});
		if (existingWallet?.userId) {
			userId = existingWallet.userId;
		}

		// Check account table
		if (!userId) {
			const existingAccount = await db.query.account.findFirst({
				where: (accounts, { eq, and }) =>
					and(
						eq(accounts.providerId, "solana"),
						eq(accounts.accountId, publicKey),
					),
			});
			if (existingAccount) {
				userId = existingAccount.userId;
			}
		}

		// Check user.walletAddress field
		if (!userId) {
			const existingUser = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.walletAddress, publicKey),
			});
			if (existingUser) {
				userId = existingUser.id;
			}
		}

		// Check user.id = publicKey (legacy)
		if (!userId) {
			const existingUser = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.id, publicKey),
			});
			if (existingUser) {
				userId = existingUser.id;
			}
		}

		// 2b. For existing users, ensure walletAddress is saved on user record
		if (userId) {
			const existingUser = await db.query.user.findFirst({
				where: (users, { eq }) => eq(users.id, userId as string),
			});
			if (existingUser && !existingUser.walletAddress) {
				await db
					.update(userSchema)
					.set({ walletAddress: publicKey })
					.where(eq(userSchema.id, userId as string));
			}
			// Ensure wallet table record exists
			const walletExists = await db.query.wallet.findFirst({
				where: (w, { eq }) => eq(w.address, publicKey),
			});
			if (!walletExists) {
				await db.insert(walletTable).values({
					id: crypto.randomUUID() as string,
					address: publicKey as string,
					userId: userId as string,
					provider: "solana",
					isPrimary: !existingUser?.walletAddress,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		// 3. Create new user if not found
		if (!userId) {
			// Use BetterAuth's internal handler to trigger user creation properly
			const internalResponse = await auth.api.signUpEmail({
				body: {
					email: `${publicKey}@solana.local`,
					password: crypto.randomUUID(), // Random password, user won't use it
					name: publicKey.slice(0, 4) + "..." + publicKey.slice(-4),
				},
			});

			if (!internalResponse?.user?.id) {
				return NextResponse.json(
					{ error: "Failed to create user" },
					{ status: 500 },
				);
			}

			userId = internalResponse.user.id;

			// Update user with wallet address
			await db
				.update(userSchema)
				.set({
					walletAddress: publicKey,
					avatarSeed: Math.random().toString(36).substring(2, 15),
				})
				.where(eq(userSchema.id, userId as string));

			// Create wallet record
			await db.insert(walletTable).values({
				id: crypto.randomUUID() as string,
				address: publicKey as string,
				userId: userId as string,
				provider: "solana",
				isPrimary: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// 4. Use BetterAuth's signIn endpoint programmatically
		// This will properly set cookies through BetterAuth's response pipeline

		// Get the user's email to sign in via BetterAuth's own mechanism
		const userRecord = await db.query.user.findFirst({
			where: (users, { eq }) => eq(users.id, userId as string),
		});

		if (!userRecord) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Call BetterAuth's signIn handler directly which properly sets cookies
		const authResponse = await auth.handler(
			new Request(`${req.nextUrl.origin}/api/auth/sign-in/email`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: req.nextUrl.origin,
				},
				body: JSON.stringify({
					email: userRecord.email,
					password: "dummy", // This won't work for existing OAuth users
				}),
			}),
		);

		// If email sign-in works (for Solana-created users), forward the response
		if (authResponse.ok) {
			// Forward all Set-Cookie headers from BetterAuth's response
			const response = NextResponse.json({ success: true });
			const setCookies = authResponse.headers.getSetCookie();
			for (const cookie of setCookies) {
				response.headers.append("Set-Cookie", cookie);
			}
			return response;
		}

		// If email sign-in didn't work (OAuth user), create session manually
		// and forward cookies from BetterAuth's handler

		// Create a session via BetterAuth's internal handler
		const sessionResponse = await auth.handler(
			new Request(`${req.nextUrl.origin}/api/auth/sign-in/solana`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: req.nextUrl.origin,
				},
				body: JSON.stringify({
					publicKey,
					signature,
					message,
				}),
			}),
		);

		// Forward response with cookies
		const response = NextResponse.json(
			await sessionResponse
				.json()
				.catch(() => ({ success: sessionResponse.ok })),
			{ status: sessionResponse.ok ? 200 : sessionResponse.status },
		);

		// Forward ALL Set-Cookie headers from the BetterAuth response
		const setCookies = sessionResponse.headers.getSetCookie();
		for (const cookie of setCookies) {
			response.headers.append("Set-Cookie", cookie);
		}

		return response;
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Authentication failed",
			},
			{ status: 500 },
		);
	}
}
