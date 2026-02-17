import type {
	AuthLinkingService,
	AuthLinkingRequest,
	AuthUnlinkingRequest,
	AuthLinkingResult,
	AuthLink,
} from "../interfaces/auth-linking";
import type { ServiceResponse } from "../types";

// Import better-auth types (would need proper imports)
type BetterAuth = Record<string, unknown>;

export class BetterAuthLinkingService implements AuthLinkingService {
	private betterAuth: BetterAuth;

	constructor(betterAuth: BetterAuth) {
		this.betterAuth = betterAuth;
	}

	async linkAccount(
		userId: string,
		request: AuthLinkingRequest
	): Promise<ServiceResponse<AuthLinkingResult>> {
		try {
			void this.betterAuth;
			const result: AuthLinkingResult = {
				link: {
					id: `link_${Date.now()}`,
					userId,
					provider: { id: request.provider, name: request.provider, type: "oauth" },
					providerUserId: `provider_${request.provider}_${Date.now()}`,
					linkedAt: new Date(),
					isPrimary: false,
				},
				user: { id: userId },
				isNewUser: false,
			};

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "LINKING_ERROR",
					message: `Failed to link account: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async unlinkAccount(
		_userId: string,
		_request: AuthUnlinkingRequest
	): Promise<ServiceResponse<void>> {
		try {
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "UNLINKING_ERROR",
					message: `Failed to unlink account: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getUserLinks(_userId: string): Promise<ServiceResponse<AuthLink[]>> {
		try {
			return { success: true, data: [] };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: `Failed to fetch user links: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async setPrimaryLink(_userId: string, _linkId: string): Promise<ServiceResponse<void>> {
		try {
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "UPDATE_ERROR",
					message: `Failed to set primary link: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async verifyLink(_linkId: string, _verificationToken: string): Promise<ServiceResponse<void>> {
		try {
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "VERIFICATION_ERROR",
					message: `Failed to verify link: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async getProviderLoginUrl(provider: string, _state: string): Promise<ServiceResponse<string>> {
		try {
			return { success: true, data: `https://auth.example.com/${provider}/login` };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "URL_ERROR",
					message: `Failed to get login URL: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}

	async handleProviderCallback(
		provider: string,
		_code: string,
		_state: string
	): Promise<ServiceResponse<AuthLinkingResult>> {
		try {
			const result: AuthLinkingResult = {
				link: {
					id: `link_${Date.now()}`,
					userId: "unknown",
					provider: { id: provider, name: provider, type: "oauth" },
					providerUserId: `provider_${provider}_${Date.now()}`,
					linkedAt: new Date(),
					isPrimary: false,
				},
				user: { id: "unknown" },
				isNewUser: true,
			};

			return { success: true, data: result };
		} catch (error) {
			return {
				success: false,
				error: {
					code: "CALLBACK_ERROR",
					message: `Failed to handle callback: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			};
		}
	}
}
