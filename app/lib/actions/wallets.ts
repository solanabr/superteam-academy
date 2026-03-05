/**
 * @fileoverview Server actions for Solana wallet management.
 * Handles linking, unlinking, and listing authenticated user wallets.
 */
"use server";

import bs58 from "bs58";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import nacl from "tweetnacl";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, wallet } from "@/lib/db/schema";

/**
 * Retrieves all wallets currently linked to the authenticated user.
 */
export async function listUserWallets() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	try {
		const wallets = await db.query.wallet.findMany({
			where: (w, { eq }) => eq(w.userId, session.user.id),
			orderBy: (w, { desc }) => [desc(w.updatedAt)],
		});
		return { data: wallets };
	} catch (error) {
		console.error("Failed to list wallets:", error);
		return { error: "Failed to fetch wallets" };
	}
}

/**
 * Removes a wallet linkage from the user's account.
 */
export async function deleteWalletAction(address: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	try {
		await db
			.delete(wallet)
			.where(
				and(eq(wallet.userId, session.user.id), eq(wallet.address, address)),
			);
		return { success: true };
	} catch (error) {
		console.error("Failed to delete wallet:", error);
		return { error: "Failed to remove wallet" };
	}
}

/**
 * Links a new Solana wallet to the user's account after signature verification.
 * Sets the wallet as primary if no other wallet is currently linked.
 */
export async function linkWalletAction(
	publicKey: string,
	signature: string,
	message: string,
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	try {
		// 1. Verify signature
		const messageBytes = new TextEncoder().encode(message);
		const signatureBytes = bs58.decode(signature);
		const publicKeyBytes = bs58.decode(publicKey);

		const isValid = nacl.sign.detached.verify(
			messageBytes,
			signatureBytes,
			publicKeyBytes,
		);

		if (!isValid) {
			return { error: "Invalid signature" };
		}

		// 2. Check if this wallet is already linked to ANOTHER user
		const existingWallet = await db.query.wallet.findFirst({
			where: (w, { eq, and, ne }) =>
				and(eq(w.address, publicKey), ne(w.userId, session.user.id)),
		});

		if (existingWallet) {
			return { error: "Wallet is already attached to another account" };
		}

		// 3. Update primary wallet if not set
		const currentUser = await db.query.user.findFirst({
			where: (u, { eq }) => eq(u.id, session.user.id),
		});

		const isPrimary = !currentUser?.walletAddress;

		if (isPrimary) {
			await db
				.update(user)
				.set({ walletAddress: publicKey })
				.where(eq(user.id, session.user.id));
		}

		// 4. Record wallet in database
		await db
			.insert(wallet)
			.values({
				id: crypto.randomUUID(),
				address: publicKey,
				userId: session.user.id,
				provider: "solana",
				isPrimary: isPrimary,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [wallet.address],
				set: {
					userId: session.user.id,
					updatedAt: new Date(),
				},
			});

		return { success: true };
	} catch (error) {
		console.error("Failed to link wallet:", error);
		return {
			error: error instanceof Error ? error.message : "Failed to link wallet",
		};
	}
}
