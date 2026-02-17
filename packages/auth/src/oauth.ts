import { betterAuth } from "better-auth";

export interface AuthConfig {
	baseURL: string;
	googleClientId?: string;
	googleClientSecret?: string;
	githubClientId?: string;
	githubClientSecret?: string;
}

export function createAuthClient(config: AuthConfig) {
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
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
			},
		},
		rateLimit: {
			window: 10 * 60 * 1000,
			max: 100,
		},
	});
}

export type AuthClient = ReturnType<typeof createAuthClient>;
