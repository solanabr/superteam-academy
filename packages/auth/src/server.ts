import { betterAuth } from "better-auth";

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
	});
}

export type ServerAuth = ReturnType<typeof createServerAuth>;
