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

export const ACADEMY_ERRORS = {
	Unauthorized: { code: 6000, msg: "Unauthorized signer" },
	CourseNotActive: { code: 6001, msg: "Course not active" },
	LessonOutOfBounds: { code: 6002, msg: "Lesson index out of bounds" },
	LessonAlreadyCompleted: { code: 6003, msg: "Lesson already completed" },
	CourseNotCompleted: { code: 6004, msg: "Not all lessons completed" },
	CourseAlreadyFinalized: { code: 6005, msg: "Course already finalized" },
	CourseNotFinalized: { code: 6006, msg: "Course not finalized" },
	PrerequisiteNotMet: { code: 6007, msg: "Prerequisite not met" },
	UnenrollCooldown: { code: 6008, msg: "Close cooldown not met (24h)" },
	EnrollmentCourseMismatch: { code: 6009, msg: "Enrollment/course mismatch" },
	Overflow: { code: 6010, msg: "Arithmetic overflow" },
	CourseIdEmpty: { code: 6011, msg: "Course ID is empty" },
	CourseIdTooLong: { code: 6012, msg: "Course ID exceeds max length" },
	InvalidLessonCount: { code: 6013, msg: "Lesson count must be at least 1" },
	InvalidDifficulty: { code: 6014, msg: "Difficulty must be 1, 2, or 3" },
	CredentialAssetMismatch: {
		code: 6015,
		msg: "Credential asset does not match enrollment record",
	},
	CredentialAlreadyIssued: {
		code: 6016,
		msg: "Credential already issued for this enrollment",
	},
	MinterNotActive: { code: 6017, msg: "Minter role is not active" },
	MinterAmountExceeded: { code: 6018, msg: "Amount exceeds minter's per-call limit" },
	LabelTooLong: { code: 6019, msg: "Minter label exceeds max length" },
	AchievementNotActive: { code: 6020, msg: "Achievement type is not active" },
	AchievementSupplyExhausted: { code: 6021, msg: "Achievement max supply reached" },
	AchievementIdTooLong: { code: 6022, msg: "Achievement ID exceeds max length" },
	AchievementNameTooLong: { code: 6023, msg: "Achievement name exceeds max length" },
	AchievementUriTooLong: { code: 6024, msg: "Achievement URI exceeds max length" },
	InvalidAmount: { code: 6025, msg: "Amount must be greater than zero" },
	InvalidXpReward: { code: 6026, msg: "XP reward must be greater than zero" },
} as const;

export type AcademyErrorName = keyof typeof ACADEMY_ERRORS;

export interface ConfigUpdatedEvent {
	field: string;
	timestamp: number;
}

export interface CourseCreatedEvent {
	course: PublicKey;
	courseId: string;
	creator: PublicKey;
	trackId: number;
	trackLevel: number;
	timestamp: number;
}

export interface CourseUpdatedEvent {
	course: PublicKey;
	version: number;
	timestamp: number;
}

export interface EnrolledEvent {
	learner: PublicKey;
	course: PublicKey;
	courseVersion: number;
	timestamp: number;
}

export interface LessonCompletedEvent {
	learner: PublicKey;
	course: PublicKey;
	lessonIndex: number;
	xpEarned: number;
	timestamp: number;
}

export interface CourseFinalizedEvent {
	learner: PublicKey;
	course: PublicKey;
	totalXp: number;
	bonusXp: bigint;
	creator: PublicKey;
	creatorXp: number;
	timestamp: number;
}

export interface EnrollmentClosedEvent {
	learner: PublicKey;
	course: PublicKey;
	completed: boolean;
	rentReclaimed: bigint;
	timestamp: number;
}

export interface CredentialIssuedEvent {
	learner: PublicKey;
	trackId: number;
	credentialAsset: PublicKey;
	currentLevel: number;
	timestamp: number;
}

export interface CredentialUpgradedEvent {
	learner: PublicKey;
	trackId: number;
	credentialAsset: PublicKey;
	currentLevel: number;
	timestamp: number;
}

export interface MinterRegisteredEvent {
	minter: PublicKey;
	label: string;
	maxXpPerCall: bigint;
	timestamp: number;
}

export interface MinterRevokedEvent {
	minter: PublicKey;
	totalXpMinted: bigint;
	timestamp: number;
}

export interface XpRewardedEvent {
	minter: PublicKey;
	recipient: PublicKey;
	amount: bigint;
	memo: string;
	timestamp: number;
}

export interface AchievementAwardedEvent {
	achievementId: string;
	recipient: PublicKey;
	asset: PublicKey;
	xpReward: number;
	timestamp: number;
}

export interface AchievementTypeCreatedEvent {
	achievementId: string;
	collection: PublicKey;
	creator: PublicKey;
	maxSupply: number;
	xpReward: number;
	timestamp: number;
}

export interface AchievementTypeDeactivatedEvent {
	achievementId: string;
	timestamp: number;
}

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

export const MAX_COURSE_ID_LEN = 32;
export const MAX_LABEL_LEN = 32;
export const MAX_ACHIEVEMENT_ID_LEN = 32;
export const MAX_ACHIEVEMENT_NAME_LEN = 64;
export const MAX_ACHIEVEMENT_URI_LEN = 128;
