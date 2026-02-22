import { type PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { findCoursePDA, findEnrollmentPDA } from "./pda";

// Anchor discriminators: sha256("global:<name>")[0..8]
const DISCRIMINATOR_ENROLL = Buffer.from([0x3a, 0x0c, 0x24, 0x03, 0x8e, 0x1c, 0x01, 0x2b]);
const DISCRIMINATOR_CLOSE_ENROLLMENT = Buffer.from([
	0xec, 0x89, 0x85, 0xfd, 0x5b, 0x8a, 0xd9, 0x5b,
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
