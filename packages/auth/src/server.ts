import { betterAuth } from "better-auth";
import { walletAuthPlugin } from "./wallet-plugin";

export interface ServerAuthConfig {
	baseURL: string;
	googleClientId?: string;
	googleClientSecret?: string;
	githubClientId?: string;
	githubClientSecret?: string;
}

export function createServerAuth(config: ServerAuthConfig) {
	const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

	if (config.googleClientId && config.googleClientSecret) {
		socialProviders.google = {
			clientId: config.googleClientId,
			clientSecret: config.googleClientSecret,
		};
	}

	if (config.githubClientId && config.githubClientSecret) {
		socialProviders.github = {
			clientId: config.githubClientId,
			clientSecret: config.githubClientSecret,
		};
	}

	return betterAuth({
		baseURL: config.baseURL,
		socialProviders,
		plugins: [walletAuthPlugin()],
		emailAndPassword: {
			enabled: true,
		},
		trustedOrigins: [config.baseURL],
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			disableSessionRefresh: true,
			cookieCache: {
				enabled: true,
				maxAge: 60 * 60 * 24 * 7,
				strategy: "jwt",
				refreshCache: true,
			},
		},
		rateLimit: {
			window: 10 * 60 * 1000,
			max: 100,
		},
		user: {
			additionalFields: {
				role: { type: "string", required: false },
				onboardingCompleted: { type: "boolean", required: false },
				walletAddress: { type: "string", required: false },
			},
		},
	});
}

export type ServerAuth = ReturnType<typeof createServerAuth>;
