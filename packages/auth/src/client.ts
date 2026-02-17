import { createAuthClient as createBetterAuthClient } from "better-auth/client";

export interface ClientAuthConfig {
	baseURL: string;
}

export function createAuthClient(config: ClientAuthConfig) {
	return createBetterAuthClient({
		baseURL: config.baseURL,
	});
}

export type AuthClient = ReturnType<typeof createAuthClient>;
