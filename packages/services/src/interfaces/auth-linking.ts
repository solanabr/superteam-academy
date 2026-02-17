import type { ServiceResponse } from "../types";

export interface AuthProvider {
	id: string;
	name: string;
	type: "oauth" | "wallet";
}

export interface AuthLink {
	id: string;
	userId: string;
	provider: AuthProvider;
	providerUserId: string;
	linkedAt: Date;
	lastUsed?: Date;
	isPrimary: boolean;
}

export interface AuthLinkingRequest {
	provider: string;
	authorizationCode: string;
	redirectUri: string;
}

export interface AuthUnlinkingRequest {
	linkId: string;
	confirmationToken?: string;
}

export interface AuthLinkingResult {
	link: AuthLink;
	user: {
		id: string;
		email?: string;
		username?: string;
		avatar?: string;
	};
	isNewUser: boolean;
	requiresVerification?: boolean;
}

export interface AuthLinkingService {
	linkAccount(
		userId: string,
		request: AuthLinkingRequest
	): Promise<ServiceResponse<AuthLinkingResult>>;
	unlinkAccount(userId: string, request: AuthUnlinkingRequest): Promise<ServiceResponse<void>>;
	getUserLinks(userId: string): Promise<ServiceResponse<AuthLink[]>>;
	setPrimaryLink(userId: string, linkId: string): Promise<ServiceResponse<void>>;
	verifyLink(linkId: string, verificationToken: string): Promise<ServiceResponse<void>>;
	getProviderLoginUrl(provider: string, state: string): Promise<ServiceResponse<string>>;
	handleProviderCallback(
		provider: string,
		code: string,
		state: string
	): Promise<ServiceResponse<AuthLinkingResult>>;
}
