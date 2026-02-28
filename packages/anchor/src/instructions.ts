import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import {
    findConfigPDA,
    findCoursePDA,
    findEnrollmentPDA,
    findAchievementTypePDA,
    findAchievementReceiptPDA,
    findMinterRolePDA,
} from "./pda";

// Well-known program IDs
const TOKEN_2022_PROGRAM_ID_STR = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const MPL_CORE_PROGRAM_ID_STR = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";
const TOKEN_2022_PROGRAM_ID = new PublicKey(TOKEN_2022_PROGRAM_ID_STR);
const MPL_CORE_PROGRAM_ID = new PublicKey(MPL_CORE_PROGRAM_ID_STR);

// Anchor discriminators: sha256("global:<name>")[0..8]
const DISCRIMINATOR_ENROLL = Buffer.from([0x3a, 0x0c, 0x24, 0x03, 0x8e, 0x1c, 0x01, 0x2b]);
const DISCRIMINATOR_CLOSE_ENROLLMENT = Buffer.from([
	0xec, 0x89, 0x85, 0xfd, 0x5b, 0x8a, 0xd9, 0x5b,
]);
const DISCRIMINATOR_COMPLETE_LESSON = Buffer.from([0x4d, 0xd9, 0x35, 0x84, 0xcc, 0x96, 0xa9, 0x3a]);
const DISCRIMINATOR_FINALIZE_COURSE = Buffer.from([0x44, 0xbd, 0x7a, 0xef, 0x27, 0x79, 0x10, 0xda]);
const DISCRIMINATOR_ISSUE_CREDENTIAL = Buffer.from([
	0xff, 0xc1, 0xab, 0xe0, 0x44, 0xab, 0xc2, 0x57,
]);
const DISCRIMINATOR_UPGRADE_CREDENTIAL = Buffer.from([
	0x02, 0x79, 0x4d, 0xff, 0x67, 0xbb, 0xfc, 0xa9,
]);

function encodeBorshString(value: string): Buffer {
	const bytes = Buffer.from(value, "utf-8");
	const len = Buffer.alloc(4);
	len.writeUInt32LE(bytes.length, 0);
	return Buffer.concat([len, bytes]);
}

export interface EnrollInstructionParams {
	courseId: string;
	learner: PublicKey;
	programId: PublicKey;
	prerequisiteCourseId?: string;
}

export function buildEnrollInstruction({
	courseId,
	learner,
	programId,
	prerequisiteCourseId,
}: EnrollInstructionParams): TransactionInstruction {
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const data = Buffer.concat([DISCRIMINATOR_ENROLL, encodeBorshString(courseId)]);

	const keys = [
		{ pubkey: coursePda, isSigner: false, isWritable: true },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: true },
		{ pubkey: learner, isSigner: true, isWritable: true },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
	];

	if (prerequisiteCourseId) {
		const [prereqCoursePda] = findCoursePDA(prerequisiteCourseId);
		const [prereqEnrollmentPda] = findEnrollmentPDA(prerequisiteCourseId, learner);
		keys.push(
			{ pubkey: prereqCoursePda, isSigner: false, isWritable: false },
			{ pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false }
		);
	}

	return new TransactionInstruction({ keys, programId, data });
}

export interface CloseEnrollmentInstructionParams {
	courseId: string;
	learner: PublicKey;
	programId: PublicKey;
}

export function buildCloseEnrollmentInstruction({
	courseId,
	learner,
	programId,
}: CloseEnrollmentInstructionParams): TransactionInstruction {
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const keys = [
		{ pubkey: coursePda, isSigner: false, isWritable: false },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: true },
		{ pubkey: learner, isSigner: true, isWritable: true },
	];

	return new TransactionInstruction({
		keys,
		programId,
		data: DISCRIMINATOR_CLOSE_ENROLLMENT,
	});
}

// ─── complete_lesson ─────────────────────────────────────────────────────────

export interface CompleteLessonParams {
	courseId: string;
	lessonIndex: number;
	learner: PublicKey;
	learnerTokenAccount: PublicKey;
	xpMint: PublicKey;
	backendSigner: PublicKey;
	programId: PublicKey;
}

export function buildCompleteLessonInstruction({
	courseId,
	lessonIndex,
	learner,
	learnerTokenAccount,
	xpMint,
	backendSigner,
	programId,
}: CompleteLessonParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const data = Buffer.concat([DISCRIMINATOR_COMPLETE_LESSON, encodeU8(lessonIndex)]);

	const keys = [
		{ pubkey: configPda, isSigner: false, isWritable: false },
		{ pubkey: coursePda, isSigner: false, isWritable: false },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: true },
		{ pubkey: learner, isSigner: false, isWritable: false },
		{ pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
		{ pubkey: xpMint, isSigner: false, isWritable: true },
		{ pubkey: backendSigner, isSigner: true, isWritable: false },
		{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({ keys, programId, data });
}

// ─── finalize_course ─────────────────────────────────────────────────────────

export interface FinalizeCourseParams {
	courseId: string;
	learner: PublicKey;
	learnerTokenAccount: PublicKey;
	creatorTokenAccount: PublicKey;
	creator: PublicKey;
	xpMint: PublicKey;
	backendSigner: PublicKey;
	programId: PublicKey;
}

export function buildFinalizeCourseInstruction({
	courseId,
	learner,
	learnerTokenAccount,
	creatorTokenAccount,
	creator,
	xpMint,
	backendSigner,
	programId,
}: FinalizeCourseParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const keys = [
		{ pubkey: configPda, isSigner: false, isWritable: false },
		{ pubkey: coursePda, isSigner: false, isWritable: true },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: true },
		{ pubkey: learner, isSigner: false, isWritable: false },
		{ pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
		{ pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
		{ pubkey: creator, isSigner: false, isWritable: false },
		{ pubkey: xpMint, isSigner: false, isWritable: true },
		{ pubkey: backendSigner, isSigner: true, isWritable: false },
		{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({ keys, programId, data: DISCRIMINATOR_FINALIZE_COURSE });
}

// ─── issue_credential ────────────────────────────────────────────────────────

export interface IssueCredentialParams {
	courseId: string;
	learner: PublicKey;
	credentialAsset: PublicKey;
	trackCollection: PublicKey;
	payer: PublicKey;
	backendSigner: PublicKey;
	credentialName: string;
	metadataUri: string;
	coursesCompleted: number;
	totalXp: bigint;
	programId: PublicKey;
}

export function buildIssueCredentialInstruction({
	courseId,
	learner,
	credentialAsset,
	trackCollection,
	payer,
	backendSigner,
	credentialName,
	metadataUri,
	coursesCompleted,
	totalXp,
	programId,
}: IssueCredentialParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const data = Buffer.concat([
		DISCRIMINATOR_ISSUE_CREDENTIAL,
		encodeBorshString(credentialName),
		encodeBorshString(metadataUri),
		encodeU32(coursesCompleted),
		encodeU64(totalXp),
	]);

	const keys = [
		{ pubkey: configPda, isSigner: false, isWritable: false },
		{ pubkey: coursePda, isSigner: false, isWritable: false },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: true },
		{ pubkey: learner, isSigner: false, isWritable: false },
		{ pubkey: credentialAsset, isSigner: true, isWritable: true },
		{ pubkey: trackCollection, isSigner: false, isWritable: true },
		{ pubkey: payer, isSigner: true, isWritable: true },
		{ pubkey: backendSigner, isSigner: true, isWritable: false },
		{ pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({ keys, programId, data });
}

// ─── upgrade_credential ──────────────────────────────────────────────────────

export interface UpgradeCredentialParams {
	courseId: string;
	learner: PublicKey;
	credentialAsset: PublicKey;
	trackCollection: PublicKey;
	payer: PublicKey;
	backendSigner: PublicKey;
	credentialName: string;
	metadataUri: string;
	coursesCompleted: number;
	totalXp: bigint;
	programId: PublicKey;
}

export function buildUpgradeCredentialInstruction({
	courseId,
	learner,
	credentialAsset,
	trackCollection,
	payer,
	backendSigner,
	credentialName,
	metadataUri,
	coursesCompleted,
	totalXp,
	programId,
}: UpgradeCredentialParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);
	const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

	const data = Buffer.concat([
		DISCRIMINATOR_UPGRADE_CREDENTIAL,
		encodeBorshString(credentialName),
		encodeBorshString(metadataUri),
		encodeU32(coursesCompleted),
		encodeU64(totalXp),
	]);

	const keys = [
		{ pubkey: configPda, isSigner: false, isWritable: false },
		{ pubkey: coursePda, isSigner: false, isWritable: false },
		{ pubkey: enrollmentPda, isSigner: false, isWritable: false },
		{ pubkey: learner, isSigner: false, isWritable: false },
		{ pubkey: credentialAsset, isSigner: false, isWritable: true },
		{ pubkey: trackCollection, isSigner: false, isWritable: true },
		{ pubkey: payer, isSigner: true, isWritable: true },
		{ pubkey: backendSigner, isSigner: true, isWritable: false },
		{ pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({ keys, programId, data });
}

// ─── Borsh encoding helpers ──────────────────────────────────────────────────

// Anchor discriminator for award_achievement: sha256("global:award_achievement")[0..8]
const DISCRIMINATOR_AWARD_ACHIEVEMENT = Buffer.from([
	0x9a, 0x7e, 0x3b, 0x82, 0x46, 0x72, 0xd2, 0x4f,
]);

export interface AwardAchievementParams {
	achievementId: string;
	recipient: PublicKey;
	asset: PublicKey;
	collection: PublicKey;
	recipientTokenAccount: PublicKey;
	xpMint: PublicKey;
	payer: PublicKey;
	minter: PublicKey;
	programId: PublicKey;
}

export function buildAwardAchievementInstruction({
	achievementId,
	recipient,
	asset,
	collection,
	recipientTokenAccount,
	xpMint,
	payer,
	minter,
	programId,
}: AwardAchievementParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [achievementTypePda] = findAchievementTypePDA(achievementId);
	const [receiptPda] = findAchievementReceiptPDA(achievementId, recipient);
	const [minterRolePda] = findMinterRolePDA(minter);

	const keys = [
		{ pubkey: configPda, isSigner: false, isWritable: false },
		{ pubkey: achievementTypePda, isSigner: false, isWritable: true },
		{ pubkey: receiptPda, isSigner: false, isWritable: true },
		{ pubkey: minterRolePda, isSigner: false, isWritable: true },
		{ pubkey: asset, isSigner: true, isWritable: true },
		{ pubkey: collection, isSigner: false, isWritable: true },
		{ pubkey: recipient, isSigner: false, isWritable: false },
		{ pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
		{ pubkey: xpMint, isSigner: false, isWritable: true },
		{ pubkey: payer, isSigner: true, isWritable: true },
		{ pubkey: minter, isSigner: true, isWritable: false },
		{ pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
		{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
	];

	return new TransactionInstruction({
		keys,
		programId,
		data: DISCRIMINATOR_AWARD_ACHIEVEMENT,
	});
}

// ─── create_course (admin) ────────────────────────────────────────────────────

const DISCRIMINATOR_CREATE_COURSE = Buffer.from([0x78, 0x79, 0x9a, 0xa4, 0x6b, 0xb4, 0xa7, 0xf1]);
const DISCRIMINATOR_UPDATE_COURSE = Buffer.from([0x51, 0xd9, 0x12, 0xc0, 0x81, 0xe9, 0x81, 0xe7]);

export interface CreateCourseInstructionParams {
	courseId: string;
	creator: PublicKey;
	contentTxId: Uint8Array | number[];
	lessonCount: number;
	difficulty: number;
	xpPerLesson: number;
	trackId: number;
	trackLevel: number;
	prerequisite: PublicKey | null;
	creatorRewardXp: number;
	minCompletionsForReward: number;
	authority: PublicKey;
	programId: PublicKey;
}

export function buildCreateCourseInstruction({
	courseId,
	creator,
	contentTxId,
	lessonCount,
	difficulty,
	xpPerLesson,
	trackId,
	trackLevel,
	prerequisite,
	creatorRewardXp,
	minCompletionsForReward,
	authority,
	programId,
}: CreateCourseInstructionParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);

	const prereqBuf = prerequisite
		? Buffer.concat([Buffer.from([1]), prerequisite.toBuffer()])
		: Buffer.from([0]);

	const data = Buffer.concat([
		DISCRIMINATOR_CREATE_COURSE,
		encodeBorshString(courseId),
		creator.toBuffer(),
		Buffer.from(contentTxId),
		encodeU8(lessonCount),
		encodeU8(difficulty),
		encodeU32(xpPerLesson),
		encodeU16(trackId),
		encodeU8(trackLevel),
		prereqBuf,
		encodeU32(creatorRewardXp),
		encodeU16(minCompletionsForReward),
	]);

	return new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: coursePda, isSigner: false, isWritable: true },
			{ pubkey: configPda, isSigner: false, isWritable: false },
			{ pubkey: authority, isSigner: true, isWritable: true },
			{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
		],
		data,
	});
}

// ─── update_course (admin) ────────────────────────────────────────────────────

export interface UpdateCourseInstructionParams {
	courseId: string;
	newContentTxId?: Uint8Array | number[] | null;
	newIsActive?: boolean | null;
	newXpPerLesson?: number | null;
	newCreatorRewardXp?: number | null;
	newMinCompletionsForReward?: number | null;
	authority: PublicKey;
	programId: PublicKey;
}

export function buildUpdateCourseInstruction({
	courseId,
	newContentTxId,
	newIsActive,
	newXpPerLesson,
	newCreatorRewardXp,
	newMinCompletionsForReward,
	authority,
	programId,
}: UpdateCourseInstructionParams): TransactionInstruction {
	const [configPda] = findConfigPDA();
	const [coursePda] = findCoursePDA(courseId);

	const data = Buffer.concat([
		DISCRIMINATOR_UPDATE_COURSE,
		encodeOptionBytes(newContentTxId ?? null),
		encodeOptionBool(newIsActive ?? null),
		encodeOptionU32(newXpPerLesson ?? null),
		encodeOptionU32(newCreatorRewardXp ?? null),
		encodeOptionU16(newMinCompletionsForReward ?? null),
	]);

	return new TransactionInstruction({
		programId,
		keys: [
			{ pubkey: configPda, isSigner: false, isWritable: false },
			{ pubkey: coursePda, isSigner: false, isWritable: true },
			{ pubkey: authority, isSigner: true, isWritable: false },
		],
		data,
	});
}

// ─── Borsh encoding helpers ──────────────────────────────────────────────────

function encodeU8(value: number): Buffer {
	const buf = Buffer.alloc(1);
	buf.writeUInt8(value, 0);
	return buf;
}

function encodeU16(value: number): Buffer {
	const buf = Buffer.alloc(2);
	buf.writeUInt16LE(value, 0);
	return buf;
}

function encodeU32(value: number): Buffer {
	const buf = Buffer.alloc(4);
	buf.writeUInt32LE(value, 0);
	return buf;
}

function encodeU64(value: bigint): Buffer {
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64LE(value, 0);
	return buf;
}

function encodeOptionBytes(bytes: Uint8Array | number[] | null): Buffer {
	if (!bytes) return Buffer.from([0]);
	return Buffer.concat([Buffer.from([1]), Buffer.from(bytes)]);
}

function encodeOptionBool(value: boolean | null): Buffer {
	if (value === null) return Buffer.from([0]);
	return Buffer.from([1, value ? 1 : 0]);
}

function encodeOptionU32(value: number | null): Buffer {
	if (value === null) return Buffer.from([0]);
	return Buffer.concat([Buffer.from([1]), encodeU32(value)]);
}

function encodeOptionU16(value: number | null): Buffer {
	if (value === null) return Buffer.from([0]);
	return Buffer.concat([Buffer.from([1]), encodeU16(value)]);
}
