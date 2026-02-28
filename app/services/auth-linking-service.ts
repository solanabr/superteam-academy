import { BaseService } from "./types";

export interface LinkedAccount {
	provider: "wallet" | "google" | "github" | "email";
	identifier: string;
	linkedAt: Date;
}

export class AuthLinkingService extends BaseService {
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

	async getLinkedAccounts(): Promise<LinkedAccount[]> {
		const res = await fetch("/api/auth/linked-accounts");
		if (!res.ok) return [];
		const data = (await res.json()) as {
			accounts?: Array<{
				provider: LinkedAccount["provider"];
				identifier: string;
				linkedAt: string;
			}>;
		};

		return (data.accounts ?? []).map((account) => ({
			...account,
			linkedAt: new Date(account.linkedAt),
		}));
	}

	async linkOAuth(
		provider: "google" | "github",
		identifier: string
	): Promise<{ success: boolean; error?: string }> {
		const res = await fetch("/api/auth/link-oauth", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, identifier }),
		});

		if (!res.ok) {
			const data = (await res.json()) as { error: string };
			return { success: false, error: data.error };
		}

		return { success: true };
	}

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
