import { type Connection, PublicKey } from "@solana/web3.js";
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
    findCoursePDA,
    findEnrollmentPDA,
    findMinterRolePDA,
    findAchievementTypePDA,
    findAchievementReceiptPDA,
} from "./pda";

const DISCRIMINATOR_SIZE = 8;

export class AcademyClient {
	readonly connection: Connection;
	readonly programId: PublicKey;

	constructor(connection: Connection, programId?: PublicKey) {
		this.connection = connection;
		this.programId = programId ?? new PublicKey(PROGRAM_ID);
	}

	// ─── Config ──────────────────────────────────────────────────────────

	async fetchConfig(): Promise<ConfigAccount | null> {
		const [pda] = findConfigPDA();
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

	// ─── Course ──────────────────────────────────────────────────────────

	async fetchCourse(courseId: string): Promise<CourseAccount | null> {
		const [pda] = findCoursePDA(courseId);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeCourse(info.data);
	}

	async fetchAllCourses(): Promise<Array<{ pubkey: PublicKey; account: CourseAccount }>> {
		const accounts = await this.connection.getProgramAccounts(this.programId, {
			filters: [{ dataSize: DISCRIMINATOR_SIZE + ACCOUNT_SIZES.Course }],
		});
		return accounts.map((a) => ({
			pubkey: a.pubkey,
			account: this.decodeCourse(a.account.data),
		}));
	}

	private decodeCourse(data: Buffer): CourseAccount {
		let offset = DISCRIMINATOR_SIZE;

		// String: 4-byte length prefix + data
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

		// Option<Pubkey>: 1-byte discriminator + 32 bytes
		const hasPrereq = data[offset] === 1;
		offset += 1;
		const prerequisite = hasPrereq ? new PublicKey(data.subarray(offset, offset + 32)) : null;
		offset += 32;

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

	// ─── Enrollment ──────────────────────────────────────────────────────

	async fetchEnrollment(courseId: string, learner: PublicKey): Promise<EnrollmentAccount | null> {
		const [pda] = findEnrollmentPDA(courseId, learner);
		const info = await this.connection.getAccountInfo(pda);
		if (!info) return null;
		return this.decodeEnrollment(info.data);
	}

	async fetchEnrollmentsForLearner(
		learner: PublicKey
	): Promise<Array<{ pubkey: PublicKey; account: EnrollmentAccount }>> {
		const accounts = await this.connection.getProgramAccounts(this.programId, {
			filters: [{ dataSize: DISCRIMINATOR_SIZE + ACCOUNT_SIZES.Enrollment }],
		});
		// Enrollment PDA = ["enrollment", courseId, learner]. Since courseId is not
		// stored in the account data we cannot memcmp-filter server-side.
		// Instead, we fetch all Courses to build a pubkey→courseId map,
		// then verify PDA derivation for the given learner.
		const courses = await this.fetchAllCourses();
		const courseIdByKey = new Map<string, string>();
		for (const c of courses) {
			courseIdByKey.set(c.pubkey.toBase58(), c.account.courseId);
		}

		return accounts
			.map((a) => ({
				pubkey: a.pubkey,
				account: this.decodeEnrollment(a.account.data),
			}))
			.filter((e) => {
				const courseId = courseIdByKey.get(e.account.course.toBase58());
				if (!courseId) return false;
				const [expectedPda] = findEnrollmentPDA(courseId, learner);
				return e.pubkey.equals(expectedPda);
			});
	}

	async fetchAllEnrollments(): Promise<Array<{ pubkey: PublicKey; account: EnrollmentAccount }>> {
		const accounts = await this.connection.getProgramAccounts(this.programId, {
			filters: [{ dataSize: DISCRIMINATOR_SIZE + ACCOUNT_SIZES.Enrollment }],
		});

		return accounts.map((account) => ({
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

		// Option<i64>
		const hasCompleted = data[offset] === 1;
		offset += 1;
		const completedAt = hasCompleted ? Number(data.readBigInt64LE(offset)) : null;
		offset += 8;

		const lessonFlags: [bigint, bigint, bigint, bigint] = [
			data.readBigUInt64LE(offset),
			data.readBigUInt64LE(offset + 8),
			data.readBigUInt64LE(offset + 16),
			data.readBigUInt64LE(offset + 24),
		];
		offset += 32;

		// Option<Pubkey>
		const hasCredential = data[offset] === 1;
		offset += 1;
		const credentialAsset = hasCredential
			? new PublicKey(data.subarray(offset, offset + 32))
			: null;
		offset += 32;

		const reserved = new Uint8Array(data.subarray(offset, offset + 4));
		offset += 4;
		const bump = data[offset];

		return { course, enrolledAt, completedAt, lessonFlags, credentialAsset, reserved, bump };
	}

	// ─── MinterRole ─────────────────────────────────────────────────────

	async fetchMinterRole(minterKey: PublicKey): Promise<MinterRoleAccount | null> {
		const [pda] = findMinterRolePDA(minterKey);
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

	// ─── AchievementType ────────────────────────────────────────────────

	async fetchAchievementType(achievementId: string): Promise<AchievementTypeAccount | null> {
		const [pda] = findAchievementTypePDA(achievementId);
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

	// ─── AchievementReceipt ─────────────────────────────────────────────

	async fetchAchievementReceipt(
		achievementId: string,
		recipient: PublicKey
	): Promise<AchievementReceiptAccount | null> {
		const [pda] = findAchievementReceiptPDA(achievementId, recipient);
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

	// ─── XP Balance ─────────────────────────────────────────────────────

	/** Fetch the XP balance for a learner's Token-2022 ATA */
	async fetchXpBalance(learnerAta: PublicKey): Promise<bigint | null> {
		const info = await this.connection.getAccountInfo(learnerAta);
		if (!info) return null;

		// Token-2022 account: mint (32) + owner (32) + amount (8) at offset 64
		if (info.data.length < 72) return null;
		return info.data.readBigUInt64LE(64);
	}
}
