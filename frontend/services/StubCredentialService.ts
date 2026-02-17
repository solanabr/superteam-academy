import type { Connection, PublicKey } from "@solana/web3.js";
import {
	BaseService,
	type Credential,
	type CredentialMetadata,
	type IssueResult,
	type VerifyResult,
	type RevokeResult,
	type TrackRequirements,
} from "./types";

const TRACK_REQUIREMENTS: Record<string, TrackRequirements> = {
	Beginner: { courses: 1, xp: 100 },
	Intermediate: { courses: 3, xp: 1000 },
	Advanced: { courses: 5, xp: 2500 },
	Expert: { courses: 8, xp: 5000 },
};

export class StubCredentialService extends BaseService {
	credentials: Map<string, Credential[]>;
	metadataCache: Map<string, CredentialMetadata | null>;

	constructor(connection: Connection, programId: PublicKey) {
		super(connection, programId);
		this.credentials = new Map();
		this.metadataCache = new Map();
	}

	async getUserCredentials(userId: string): Promise<Credential[]> {
		return this.credentials.get(userId) ?? [];
	}

	async issueCredential(
		_learner: PublicKey,
		track: string,
		coursesCompleted: number,
		totalXp: number
	): Promise<IssueResult> {
		if (!track) {
			return { success: false, error: "Invalid track: track is required" };
		}

		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			return { success: false, error: `Invalid track: ${track}` };
		}

		if (coursesCompleted < 0 || totalXp < 0) {
			return { success: false, error: "Invalid parameters" };
		}

		if (coursesCompleted < requirements.courses || totalXp < requirements.xp) {
			return { success: false, error: "Track requirements not met" };
		}

		const credentialId = `cred-${Date.now()}`;
		return { success: true, credentialId };
	}

	async verifyCredential(credentialId: string): Promise<VerifyResult> {
		for (const creds of this.credentials.values()) {
			const credential = creds.find((c) => c.id === credentialId);
			if (credential) {
				if (!credential.isActive) {
					return { isValid: false, error: "Credential is inactive" };
				}
				return { isValid: true, credential };
			}
		}
		return { isValid: false, error: "Credential not found" };
	}

	async getCredentialMetadata(credentialId: string): Promise<CredentialMetadata> {
		const cached = this.metadataCache.get(credentialId);
		if (cached === null) {
			throw new Error("Failed to fetch metadata");
		}
		if (cached) {
			return cached;
		}

		const metadata: CredentialMetadata = {
			name: "Superteam Academy Credential",
			description: "Completion credential for Beginner track",
			image: "https://arweave.net/credential-image",
			attributes: [
				{ trait_type: "Track", value: "Beginner" },
				{ trait_type: "Courses Completed", value: "3" },
				{ trait_type: "Total XP", value: "750" },
			],
		};

		this.metadataCache.set(credentialId, metadata);
		return metadata;
	}

	async revokeCredential(credentialId: string): Promise<RevokeResult> {
		for (const [userId, creds] of this.credentials.entries()) {
			const index = creds.findIndex((c) => c.id === credentialId);
			if (index !== -1) {
				creds[index] = { ...creds[index], isActive: false };
				this.credentials.set(userId, creds);
				return { success: true };
			}
		}
		return { success: false, error: "Credential not found" };
	}

	getTrackRequirements(track: string): TrackRequirements {
		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			throw new Error(`Invalid track: ${track}`);
		}
		return requirements;
	}

	async getCredentialsByTrack(userId: string, track: string): Promise<Credential[]> {
		const creds = this.credentials.get(userId) ?? [];
		return creds.filter((c) => c.track === track);
	}
}
