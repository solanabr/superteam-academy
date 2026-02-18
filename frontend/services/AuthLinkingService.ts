import { BaseService } from "./types";

export interface LinkedAccount {
	provider: "wallet" | "google" | "github" | "email";
	identifier: string;
	linkedAt: Date;
}

export class AuthLinkingService extends BaseService {
	/**
	 * Link a wallet address to an existing OAuth account.
	 * In production, this calls a server endpoint that:
	 * 1. Verifies the wallet signature
	 * 2. Associates the wallet pubkey with the user record
	 * 3. Returns the updated linked accounts
	 */
	async linkWallet(
		publicKey: string,
		signature: string,
		message: string
	): Promise<{ success: boolean; error?: string }> {
		const res = await fetch("/api/auth/link-wallet", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ publicKey, signature, message }),
		});

		if (!res.ok) {
			const data = (await res.json()) as { error: string };
			return { success: false, error: data.error };
		}

		return { success: true };
	}

	/**
	 * Get all linked accounts for the current user.
	 */
	async getLinkedAccounts(): Promise<LinkedAccount[]> {
		const res = await fetch("/api/auth/linked-accounts");
		if (!res.ok) return [];
		return (await res.json()) as LinkedAccount[];
	}

	/**
	 * Unlink a specific provider from the current user.
	 */
	async unlinkAccount(provider: string): Promise<{ success: boolean; error?: string }> {
		const res = await fetch("/api/auth/unlink", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider }),
		});

		if (!res.ok) {
			const data = (await res.json()) as { error: string };
			return { success: false, error: data.error };
		}

		return { success: true };
	}
}
