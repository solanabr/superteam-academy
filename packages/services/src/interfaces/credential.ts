import type { ServiceResponse } from "../types";

export interface Credential {
	id: string;
	learnerId: string;
	trackId: number;
	level: number;
	issuedAt: Date;
	metadataUri: string;
	assetId?: string; // For on-chain assets
}

export interface CredentialIssuanceRequest {
	learnerId: string;
	trackId: number;
	level: number;
	proofData?: unknown; // Course completion proofs, etc.
}

export interface CredentialVerificationResult {
	isValid: boolean;
	credential?: Credential;
	verificationDetails?: unknown;
}

export interface CredentialService {
	issueCredential(request: CredentialIssuanceRequest): Promise<ServiceResponse<Credential>>;
	getCredential(credentialId: string): Promise<ServiceResponse<Credential>>;
	getLearnerCredentials(learnerId: string): Promise<ServiceResponse<Credential[]>>;
	verifyCredential(credentialId: string): Promise<ServiceResponse<CredentialVerificationResult>>;
	upgradeCredential(credentialId: string, newLevel: number): Promise<ServiceResponse<Credential>>;
	revokeCredential(credentialId: string, reason: string): Promise<ServiceResponse<void>>;
}
