import { createServerAuth, type ServerAuthConfig } from "@superteam/auth";
import { cookies } from "next/headers";

const authConfig: ServerAuthConfig = {
	baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
	googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
	githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
	githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
};

export const serverAuth = createServerAuth(authConfig);


function safeGetLinkedWallet(rawLinkedAccounts: string | undefined) {
	if (!rawLinkedAccounts) return undefined;

	try {
		const accounts = JSON.parse(rawLinkedAccounts) as Array<{
			provider?: string;
			identifier?: string;
		}>;

		return accounts.find(
			(account) => account.provider === "wallet" && typeof account.identifier === "string",
		)?.identifier;
	} catch {
		return undefined;
	}
}

export async function getLinkedWallet() {

		const cookieStore = await cookies();
		const rawLinkedAccounts = cookieStore.get("linked_accounts")?.value;
		return safeGetLinkedWallet(rawLinkedAccounts);
}
