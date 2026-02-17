import type { Connection, PublicKey } from "@solana/web3.js";

export interface Credential {
	id: string;
	track: string;
	issuedAt: Date;
	coursesCompleted: number;
	totalXp: number;
	metadataUri: string;
	isActive: boolean;
}

export interface CredentialMetadata {
	name: string;
	description: string;
	image: string;
	attributes: Array<{ trait_type: string; value: string }>;
}

export interface IssueResult {
	success: boolean;
	credentialId?: string;
	error?: string;
}

export interface VerifyResult {
	isValid: boolean;
	credential?: Credential;
	error?: string;
}

export interface RevokeResult {
	success: boolean;
	error?: string;
}

export interface TrackRequirements {
	courses: number;
	xp: number;
}

export class BaseService {
	connection: Connection;
	programId: PublicKey;

	constructor(connection: Connection, programId: PublicKey) {
		this.connection = connection;
		this.programId = programId;
	}
}
