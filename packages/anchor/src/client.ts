import { type Connection, PublicKey } from "@solana/web3.js";
import { createHash } from "node:crypto";
import {
	PROGRAM_ID,
	ACCOUNT_SIZES,
	type ConfigAccount,
	type CourseAccount,
	type EnrollmentAccount,
	type MinterRoleAccount,
	type AchievementTypeAccount,
	type AchievementReceiptAccount,
} from "./idl";
import {
	findConfigPDA,
	findMinterRolePDA,
	findAchievementTypePDA,
	findAchievementReceiptPDA,
} from "./pda";

const DISCRIMINATOR_SIZE = 8;
const ENROLLMENT_DISCRIMINATOR = accountDiscriminator("Enrollment");

function accountDiscriminator(accountName: string): Buffer {
	return createHash("sha256").update(`account:${accountName}`).digest().subarray(0, 8);
}

function hasDiscriminator(data: Buffer, discriminator: Buffer): boolean {
	if (data.length < DISCRIMINATOR_SIZE) return false;
	for (let i = 0; i < DISCRIMINATOR_SIZE; i += 1) {
		if (data[i] !== discriminator[i]) return false;
	}
	return true;
}

export class AcademyClient {
	readonly connection: Connection;
	readonly programId: PublicKey;

	constructor(connection: Connection, programId?: PublicKey) {
		this.connection = connection;
		this.programId = programId ?? new PublicKey(PROGRAM_ID);
	}

	private findCoursePDA(courseId: string): [PublicKey, number] {
		return PublicKey.findProgramAddressSync(
			[Buffer.from("course"), Buffer.from(courseId)],
			this.programId
		);
	}

	private findEnrollmentPDA(courseId: string, learner: PublicKey): [PublicKey, number] {
		return PublicKey.findProgramAddressSync(
			[Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
			this.programId
		);
	}

	async fetchConfig(): Promise<ConfigAccount | null> {
		const [pda] = findConfigPDA(this.programId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeConfig(info.data);
	}

	private decodeConfig(data: Buffer): ConfigAccount {
		let offset = DISCRIMINATOR_SIZE;
		const authority = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const backendSigner = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const xpMint = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const reserved = new Uint8Array(data.subarray(offset, offset + 8));
		offset += 8;
		const bump = data[offset];
		return { authority, backendSigner, xpMint, reserved, bump };
	}

	async fetchCourse(courseId: string): Promise<CourseAccount | null> {
		const [pda] = this.findCoursePDA(courseId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeCourse(info.data);
	}

	async fetchAllCourses(): Promise<Array<{ pubkey: PublicKey; account: CourseAccount }>> {
		const accounts = await this.connection.getProgramAccounts(this.programId, {
			filters: [{ dataSize: ACCOUNT_SIZES.Course }],
		});
		return accounts.map((a) => ({
			pubkey: a.pubkey,
			account: this.decodeCourse(a.account.data),
		}));
	}

	private decodeCourse(data: Buffer): CourseAccount {
		let offset = DISCRIMINATOR_SIZE;

		const courseIdLen = data.readUInt32LE(offset);
		offset += 4;
		const courseId = data.subarray(offset, offset + courseIdLen).toString("utf-8");
		offset += courseIdLen;

		const creator = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const contentTxId = new Uint8Array(data.subarray(offset, offset + 32));
		offset += 32;
		const version = data.readUInt16LE(offset);
		offset += 2;
		const lessonCount = data[offset];
		offset += 1;
		const difficulty = data[offset];
		offset += 1;
		const xpPerLesson = data.readUInt32LE(offset);
		offset += 4;
		const trackId = data.readUInt16LE(offset);
		offset += 2;
		const trackLevel = data[offset];
		offset += 1;

		const hasPrereq = data[offset] === 1;
		offset += 1;
		const prerequisite = hasPrereq ? new PublicKey(data.subarray(offset, offset + 32)) : null;
		if (hasPrereq) {
			offset += 32;
		}

		const creatorRewardXp = data.readUInt32LE(offset);
		offset += 4;
		const minCompletionsForReward = data.readUInt16LE(offset);
		offset += 2;

		const totalCompletions = data.readUInt32LE(offset);
		offset += 4;
		const totalEnrollments = data.readUInt32LE(offset);
		offset += 4;
		const isActive = data[offset] === 1;
		offset += 1;
		const createdAt = Number(data.readBigInt64LE(offset));
		offset += 8;
		const updatedAt = Number(data.readBigInt64LE(offset));
		offset += 8;
		const reserved = new Uint8Array(data.subarray(offset, offset + 8));
		offset += 8;
		const bump = data[offset];

		return {
			courseId,
			creator,
			contentTxId,
			version,
			lessonCount,
			difficulty,
			xpPerLesson,
			trackId,
			trackLevel,
			prerequisite,
			creatorRewardXp,
			minCompletionsForReward,
			totalCompletions,
			totalEnrollments,
			isActive,
			createdAt,
			updatedAt,
			reserved,
			bump,
		};
	}

	async fetchEnrollment(courseId: string, learner: PublicKey): Promise<EnrollmentAccount | null> {
		const [pda] = this.findEnrollmentPDA(courseId, learner);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeEnrollment(info.data);
	}

	/**
	 * Fetch enrollments by deriving each enrollment PDA from known courses.
	 * Uses getMultipleAccountsInfo for a single batched RPC call instead of
	 * scanning all program accounts.
	 */
	async fetchEnrollmentsForLearner(
		learner: PublicKey,
		courses?: Array<{ pubkey: PublicKey; account: CourseAccount }>
	): Promise<Array<{ pubkey: PublicKey; account: EnrollmentAccount }>> {
		const allCourses = courses ?? (await this.fetchAllCourses());
		if (allCourses.length === 0) return [];

		const pdas = allCourses.map((c) => {
			const [pda] = this.findEnrollmentPDA(c.account.courseId, learner);
			return pda;
		});

		// Batch fetch all enrollment PDAs in one RPC call
		const infos = await this.connection.getMultipleAccountsInfo(pdas);

		const results: Array<{ pubkey: PublicKey; account: EnrollmentAccount }> = [];
		for (let i = 0; i < infos.length; i++) {
			const info = infos[i];
			if (!info) continue;
			try {
				results.push({
					pubkey: pdas[i],
					account: this.decodeEnrollment(info.data as Buffer),
				});
			} catch {
				// Skip accounts that fail to decode
			}
		}
		return results;
	}

	async fetchAllEnrollments(): Promise<Array<{ pubkey: PublicKey; account: EnrollmentAccount }>> {
		const accounts = await this.connection.getProgramAccounts(this.programId);

		return accounts
			.filter((account) => hasDiscriminator(account.account.data, ENROLLMENT_DISCRIMINATOR))
			.map((account) => ({
				pubkey: account.pubkey,
				account: this.decodeEnrollment(account.account.data),
			}));
	}

	private decodeEnrollment(data: Buffer): EnrollmentAccount {
		let offset = DISCRIMINATOR_SIZE;
		const course = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const enrolledAt = Number(data.readBigInt64LE(offset));
		offset += 8;

		const hasCompleted = data[offset] === 1;
		offset += 1;
		const completedAt = hasCompleted ? Number(data.readBigInt64LE(offset)) : null;
		if (hasCompleted) {
			offset += 8;
		}

		const lessonFlags: [bigint, bigint, bigint, bigint] = [
			data.readBigUInt64LE(offset),
			data.readBigUInt64LE(offset + 8),
			data.readBigUInt64LE(offset + 16),
			data.readBigUInt64LE(offset + 24),
		];
		offset += 32;

		const hasCredential = data[offset] === 1;
		offset += 1;
		const credentialAsset = hasCredential
			? new PublicKey(data.subarray(offset, offset + 32))
			: null;
		if (hasCredential) {
			offset += 32;
		}

		const reserved = new Uint8Array(data.subarray(offset, offset + 4));
		offset += 4;
		const bump = data[offset];

		return { course, enrolledAt, completedAt, lessonFlags, credentialAsset, reserved, bump };
	}

	async fetchMinterRole(minterKey: PublicKey): Promise<MinterRoleAccount | null> {
		const [pda] = findMinterRolePDA(minterKey, this.programId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeMinterRole(info.data);
	}

	private decodeMinterRole(data: Buffer): MinterRoleAccount {
		let offset = DISCRIMINATOR_SIZE;
		const minter = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const labelLen = data.readUInt32LE(offset);
		offset += 4;
		const label = data.subarray(offset, offset + labelLen).toString("utf-8");
		offset += labelLen;
		const maxXpPerCall = data.readBigUInt64LE(offset);
		offset += 8;
		const totalXpMinted = data.readBigUInt64LE(offset);
		offset += 8;
		const isActive = data[offset] === 1;
		offset += 1;
		const createdAt = Number(data.readBigInt64LE(offset));
		offset += 8;
		const reserved = new Uint8Array(data.subarray(offset, offset + 8));
		offset += 8;
		const bump = data[offset];
		return { minter, label, maxXpPerCall, totalXpMinted, isActive, createdAt, reserved, bump };
	}

	async fetchAchievementType(achievementId: string): Promise<AchievementTypeAccount | null> {
		const [pda] = findAchievementTypePDA(achievementId, this.programId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeAchievementType(info.data);
	}

	async fetchAllAchievementTypes(): Promise<
		Array<{ pubkey: PublicKey; account: AchievementTypeAccount }>
	> {
		const accounts = await this.connection.getProgramAccounts(this.programId, {
			filters: [{ dataSize: DISCRIMINATOR_SIZE + ACCOUNT_SIZES.AchievementType }],
		});
		return accounts.map((a) => ({
			pubkey: a.pubkey,
			account: this.decodeAchievementType(a.account.data),
		}));
	}

	private decodeAchievementType(data: Buffer): AchievementTypeAccount {
		let offset = DISCRIMINATOR_SIZE;

		const achievementIdLen = data.readUInt32LE(offset);
		offset += 4;
		const achievementId = data.subarray(offset, offset + achievementIdLen).toString("utf-8");
		offset += achievementIdLen;

		const nameLen = data.readUInt32LE(offset);
		offset += 4;
		const name = data.subarray(offset, offset + nameLen).toString("utf-8");
		offset += nameLen;

		const metadataUriLen = data.readUInt32LE(offset);
		offset += 4;
		const metadataUri = data.subarray(offset, offset + metadataUriLen).toString("utf-8");
		offset += metadataUriLen;

		const collection = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const creator = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const maxSupply = data.readUInt32LE(offset);
		offset += 4;
		const currentSupply = data.readUInt32LE(offset);
		offset += 4;
		const xpReward = data.readUInt32LE(offset);
		offset += 4;
		const isActive = data[offset] === 1;
		offset += 1;
		const createdAt = Number(data.readBigInt64LE(offset));
		offset += 8;
		const reserved = new Uint8Array(data.subarray(offset, offset + 8));
		offset += 8;
		const bump = data[offset];

		return {
			achievementId,
			name,
			metadataUri,
			collection,
			creator,
			maxSupply,
			currentSupply,
			xpReward,
			isActive,
			createdAt,
			reserved,
			bump,
		};
	}

	async fetchAchievementReceipt(
		achievementId: string,
		recipient: PublicKey
	): Promise<AchievementReceiptAccount | null> {
		const [pda] = findAchievementReceiptPDA(achievementId, recipient, this.programId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeAchievementReceipt(info.data);
	}

	private decodeAchievementReceipt(data: Buffer): AchievementReceiptAccount {
		let offset = DISCRIMINATOR_SIZE;
		const asset = new PublicKey(data.subarray(offset, offset + 32));
		offset += 32;
		const awardedAt = Number(data.readBigInt64LE(offset));
		offset += 8;
		const bump = data[offset];
		return { asset, awardedAt, bump };
	}

	/** Fetch the XP balance for a learner's Token-2022 ATA */
	async fetchXpBalance(learnerAta: PublicKey): Promise<bigint | null> {
		const info = await this.connection.getAccountInfo(learnerAta);
		if (!info) return null;

		if (info.data.length < 72) return null;
		return info.data.readBigUInt64LE(64);
	}
}
