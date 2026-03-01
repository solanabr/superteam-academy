import type { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = "3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb";

export interface ConfigAccount {
	authority: PublicKey;
	backendSigner: PublicKey;
	xpMint: PublicKey;
	reserved: Uint8Array; // [u8; 8]
	bump: number;
}

export interface CourseAccount {
	courseId: string;
	creator: PublicKey;
	contentTxId: Uint8Array; // [u8; 32]
	version: number; // u16
	lessonCount: number; // u8
	difficulty: number; // u8  (1=easy, 2=medium, 3=hard)
	xpPerLesson: number; // u32
	trackId: number; // u16
	trackLevel: number; // u8
	prerequisite: PublicKey | null;
	creatorRewardXp: number; // u32
	minCompletionsForReward: number; // u16
	totalCompletions: number; // u32
	totalEnrollments: number; // u32
	isActive: boolean;
	createdAt: number; // i64
	updatedAt: number; // i64
	reserved: Uint8Array; // [u8; 8]
	bump: number;
}

export interface EnrollmentAccount {
	course: PublicKey;
	enrolledAt: number; // i64
	completedAt: number | null; // Option<i64>
	lessonFlags: [bigint, bigint, bigint, bigint]; // [u64; 4] — bitmap for up to 256 lessons
	credentialAsset: PublicKey | null;
	reserved: Uint8Array; // [u8; 4]
	bump: number;
}

export interface MinterRoleAccount {
	minter: PublicKey;
	label: string;
	maxXpPerCall: bigint; // u64
	totalXpMinted: bigint; // u64
	isActive: boolean;
	createdAt: number; // i64
	reserved: Uint8Array; // [u8; 8]
	bump: number;
}

export interface AchievementTypeAccount {
	achievementId: string;
	name: string;
	metadataUri: string;
	collection: PublicKey;
	creator: PublicKey;
	maxSupply: number; // u32
	currentSupply: number; // u32
	xpReward: number; // u32
	isActive: boolean;
	createdAt: number; // i64
	reserved: Uint8Array; // [u8; 8]
	bump: number;
}

export interface AchievementReceiptAccount {
	asset: PublicKey;
	awardedAt: number; // i64
	bump: number;
}

export interface CreateCourseParams {
	courseId: string;
	creator: PublicKey;
	contentTxId: Uint8Array; // [u8; 32]
	lessonCount: number; // u8
	difficulty: number; // u8
	xpPerLesson: number; // u32
	trackId: number; // u16
	trackLevel: number; // u8
	prerequisite: PublicKey | null;
	creatorRewardXp: number; // u32
	minCompletionsForReward: number; // u16
}

export interface UpdateCourseParams {
	newContentTxId: Uint8Array | null; // Option<[u8; 32]>
	newIsActive: boolean | null;
	newXpPerLesson: number | null; // Option<u32>
	newCreatorRewardXp: number | null; // Option<u32>
	newMinCompletionsForReward: number | null; // Option<u16>
}

export interface UpdateConfigParams {
	newBackendSigner: PublicKey | null;
}

export interface RegisterMinterParams {
	minter: PublicKey;
	label: string;
	maxXpPerCall: bigint; // u64
}

export interface CreateAchievementTypeParams {
	achievementId: string;
	name: string;
	metadataUri: string;
	maxSupply: number; // u32
	xpReward: number; // u32
}

export const ACCOUNT_SIZES = {
	Config: 113,
	Course: 192,
	Enrollment: 127,
	MinterRole: 110,
	AchievementType: 338,
	AchievementReceipt: 49,
} as const;

export const PDA_SEEDS = {
	config: [Buffer.from("config")] as const,
	course: (courseId: string) => [Buffer.from("course"), Buffer.from(courseId)] as const,
	enrollment: (courseId: string, learner: PublicKey) =>
		[Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()] as const,
	minter: (minterKey: PublicKey) => [Buffer.from("minter"), minterKey.toBuffer()] as const,
	achievement: (achievementId: string) =>
		[Buffer.from("achievement"), Buffer.from(achievementId)] as const,
	achievementReceipt: (achievementId: string, recipient: PublicKey) =>
		[
			Buffer.from("achievement_receipt"),
			Buffer.from(achievementId),
			recipient.toBuffer(),
		] as const,
} as const;

/** Check if a specific lesson is completed in the bitmap flags */
export function isLessonCompleted(lessonFlags: readonly bigint[], lessonIndex: number): boolean {
	const wordIndex = Math.floor(lessonIndex / 64);
	const bitIndex = lessonIndex % 64;
	if (wordIndex >= lessonFlags.length) return false;
	return (lessonFlags[wordIndex] & (1n << BigInt(bitIndex))) !== 0n;
}

/** Count total completed lessons from bitmap flags */
export function countCompletedLessons(lessonFlags: readonly bigint[]): number {
	let count = 0;
	for (const word of lessonFlags) {
		let w = word;
		while (w !== 0n) {
			w &= w - 1n;
			count++;
		}
	}
	return count;
}
