import type { PublicKey } from "@solana/web3.js";
import {
	BaseService,
	type Credential,
	type CredentialMetadata,
	type IssueResult,
	type VerifyResult,
	type TrackRequirements,
} from "./types";
import { AcademyClient } from "@superteam/anchor";

const TRACK_REQUIREMENTS: Record<string, TrackRequirements> = {
	Beginner: { courses: 1, xp: 100 },
	Intermediate: { courses: 3, xp: 1000 },
	Advanced: { courses: 5, xp: 2500 },
	Expert: { courses: 8, xp: 5000 },
};

export class CredentialService extends BaseService {
	private client: AcademyClient;

	constructor(...args: ConstructorParameters<typeof BaseService>) {
		super(...args);
		this.client = new AcademyClient(this.connection, this.programId);
	}

	async getEnrollmentCredential(
		courseId: string,
		learner: PublicKey
	): Promise<Credential | null> {
		const enrollment = await this.client.fetchEnrollment(courseId, learner);
		if (!enrollment?.credentialAsset) return null;

		const course = await this.client.fetchCourse(courseId);
		if (!course) return null;

		return {
			id: enrollment.credentialAsset.toBase58(),
			track: `Track ${course.trackId} - Level ${course.trackLevel}`,
			issuedAt: new Date((enrollment.completedAt ?? enrollment.enrolledAt) * 1000),
			coursesCompleted: 1,
			totalXp: course.xpPerLesson * course.lessonCount,
			metadataUri: "",
			isActive: true,
		};
	}

	async issueCredential(
		_learner: PublicKey,
		track: string,
		coursesCompleted: number,
		totalXp: number
	): Promise<IssueResult> {
		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			return { success: false, error: `Invalid track: ${track}` };
		}
		if (coursesCompleted < requirements.courses || totalXp < requirements.xp) {
			return { success: false, error: "Track requirements not met" };
		}
		// Actual credential issuance requires a backend signer transaction.
		// This returns a placeholder — the backend would submit the
		// issue_credential instruction on behalf of the learner.
		return { success: true, credentialId: `pending-${Date.now()}` };
	}

	async verifyCredential(credentialId: string): Promise<VerifyResult> {
		// In production: fetch the Metaplex Core asset by ID and verify
		// its on-chain state (frozen, collection membership, attributes).
		return { isValid: false, error: `Verification for ${credentialId} requires DAS API` };
	}

	async getCredentialMetadata(_credentialId: string): Promise<CredentialMetadata> {
		// In production: fetch from Metaplex Core asset's URI
		return {
			name: "Superteam Academy Credential",
			description: "On-chain learning credential",
			image: "",
			attributes: [],
		};
	}

	getTrackRequirements(track: string): TrackRequirements {
		const requirements = TRACK_REQUIREMENTS[track];
		if (!requirements) {
			throw new Error(`Invalid track: ${track}`);
		}
		return requirements;
	}
}
