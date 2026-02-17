import type {
	CredentialService,
	Credential,
	CredentialIssuanceRequest,
	CredentialVerificationResult,
} from "../interfaces/credential";
import type { ServiceResponse } from "../types";

export class StubCredentialService implements CredentialService {
	private credentialStore = new Map<string, Credential>();

	async issueCredential(
		request: CredentialIssuanceRequest
	): Promise<ServiceResponse<Credential>> {
		const credential: Credential = {
			id: `cred_${Date.now()}`,
			learnerId: request.learnerId,
			trackId: request.trackId,
			level: request.level,
			issuedAt: new Date(),
			metadataUri: `https://arweave.net/credential/${request.trackId}/${request.level}`,
			assetId: `asset_${Date.now()}`,
		};

		this.credentialStore.set(credential.id, credential);

		return {
			success: true,
			data: credential,
		};
	}

	async getCredential(credentialId: string): Promise<ServiceResponse<Credential>> {
		const credential = this.credentialStore.get(credentialId);

		if (!credential) {
			return {
				success: false,
				error: "Credential not found",
			};
		}

		return {
			success: true,
			data: credential,
		};
	}

	async getLearnerCredentials(learnerId: string): Promise<ServiceResponse<Credential[]>> {
		const credentials: Credential[] = [];

		for (const credential of this.credentialStore.values()) {
			if (credential.learnerId === learnerId) {
				credentials.push(credential);
			}
		}

		return {
			success: true,
			data: credentials,
		};
	}

	async verifyCredential(
		credentialId: string
	): Promise<ServiceResponse<CredentialVerificationResult>> {
		const credential = this.credentialStore.get(credentialId);

		const result: CredentialVerificationResult = {
			isValid: !!credential,
			...(credential ? { credential } : {}),
			verificationDetails: {
				verifiedAt: new Date(),
				method: "stub_verification",
			},
		};

		return {
			success: true,
			data: result,
		};
	}

	async upgradeCredential(
		credentialId: string,
		newLevel: number
	): Promise<ServiceResponse<Credential>> {
		const credential = this.credentialStore.get(credentialId);

		if (!credential) {
			return {
				success: false,
				error: "Credential not found",
			};
		}

		credential.level = newLevel;
		this.credentialStore.set(credentialId, credential);

		return {
			success: true,
			data: credential,
		};
	}

	async revokeCredential(credentialId: string, _reason: string): Promise<ServiceResponse<void>> {
		const exists = this.credentialStore.has(credentialId);

		if (!exists) {
			return {
				success: false,
				error: "Credential not found",
			};
		}

		this.credentialStore.delete(credentialId);

		return {
			success: true,
		};
	}
}
