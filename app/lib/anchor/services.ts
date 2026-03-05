/**
 * @fileoverview Services for retrieving and calculating on-chain data from the Onchain Academy program.
 * Includes XP balance retrieval, level calculation, and progress tracking logic.
 */

import { BN, Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
	connection,
	getConfigPda,
	getCoursePda,
	getEnrollmentPda,
	TOKEN_2022_PROGRAM_ID,
} from "./client";
import { OnchainAcademy } from "./idl/onchain_academy";

/**
 * Get XP balance for a wallet
 */
export async function getXpBalance(walletAddress: PublicKey): Promise<number> {
	try {
		const [configPda] = getConfigPda();
		const config = await connection.getAccountInfo(configPda);

		if (!config) {
			console.warn("Config PDA not found - program not initialized");
			return 0;
		}

		// Parse config to get xpMint address
		// For now, use the env variable
		const xpMint = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);

		const xpAta = getAssociatedTokenAddressSync(
			xpMint,
			walletAddress,
			false,
			TOKEN_2022_PROGRAM_ID,
		);

		const accountInfo = await connection.getAccountInfo(xpAta);
		if (!accountInfo) return 0;

		const balance = await connection.getTokenAccountBalance(xpAta);
		return Number(balance.value.amount);
	} catch (error) {
		console.error("Error fetching XP balance:", error);
		return 0;
	}
}

/**
 * Calculate level from XP
 * Level = floor(sqrt(xp / 100))
 */
export function calculateLevel(xp: number): number {
	return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
	const nextLevel = currentLevel + 1;
	return nextLevel * nextLevel * 100;
}

/**
 * Get enrollment status and progress for a course
 */
export async function getCourseProgress(
	program: Program<OnchainAcademy>,
	courseId: string,
	learner: PublicKey,
): Promise<{
	enrolled: boolean;
	completedLessons: number[];
	totalLessons: number;
	isFinalized: boolean;
	credentialAsset: PublicKey | null;
} | null> {
	try {
		const [coursePda] = getCoursePda(courseId);
		const [enrollmentPda] = getEnrollmentPda(courseId, learner);

		const course = await program.account.course.fetch(coursePda);
		const enrollment =
			await program.account.enrollment.fetchNullable(enrollmentPda);

		if (!enrollment) {
			return {
				enrolled: false,
				completedLessons: [],
				totalLessons: course.lessonCount,
				isFinalized: false,
				credentialAsset: null,
			};
		}

		// Parse lesson bitmap
		const completedLessons = getCompletedLessonIndices(
			enrollment.lessonFlags,
			course.lessonCount,
		);

		return {
			enrolled: true,
			completedLessons,
			totalLessons: course.lessonCount,
			isFinalized: enrollment.completedAt !== null,
			credentialAsset: enrollment.credentialAsset || null,
		};
	} catch (error) {
		console.error("Error fetching course progress:", error);
		return null;
	}
}

/**
 * Check if a specific lesson is completed
 */
export function isLessonComplete(
	lessonFlags: BN[],
	lessonIndex: number,
): boolean {
	const wordIndex = Math.floor(lessonIndex / 64);
	const bitIndex = lessonIndex % 64;
	return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Count total completed lessons from bitmap
 */
export function countCompletedLessons(lessonFlags: BN[]): number {
	return lessonFlags.reduce((sum, word) => {
		let count = 0;
		let w = word.clone();
		while (!w.isZero()) {
			count += w.and(new BN(1)).toNumber();
			w = w.shrn(1);
		}
		return sum + count;
	}, 0);
}

/**
 * Get array of completed lesson indices
 */
export function getCompletedLessonIndices(
	lessonFlags: BN[],
	lessonCount: number,
): number[] {
	const completed: number[] = [];
	for (let i = 0; i < lessonCount; i++) {
		if (isLessonComplete(lessonFlags, i)) {
			completed.push(i);
		}
	}
	return completed;
}

/**
 * Get all active courses
 */
export async function getActiveCourses(program: Program<OnchainAcademy>) {
	try {
		const allCourses = await program.account.course.all();
		return allCourses.filter((c) => c.account.isActive);
	} catch (error) {
		console.error("Error fetching courses:", error);
		return [];
	}
}

/**
 * Get user's enrollments
 */
export async function getUserEnrollments(
	program: Program<OnchainAcademy>,
	learner: PublicKey,
) {
	try {
		const allCourses = await program.account.course.all();
		const enrollments = [];

		for (const course of allCourses) {
			const [enrollmentPda] = getEnrollmentPda(
				course.account.courseId,
				learner,
			);

			const enrollment =
				await program.account.enrollment.fetchNullable(enrollmentPda);
			if (enrollment) {
				enrollments.push({
					publicKey: enrollmentPda,
					account: enrollment,
					courseId: course.account.courseId,
				});
			}
		}
		return enrollments;
	} catch (error) {
		console.error("Error fetching enrollments:", error);
		return [];
	}
}
