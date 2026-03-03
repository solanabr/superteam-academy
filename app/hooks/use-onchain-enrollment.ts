"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAcademyClient } from "@/lib/academy";
import { PublicKey } from "@solana/web3.js";
import { countCompletedLessons, isLessonCompleted } from "@superteam-academy/anchor";

interface OnchainEnrollment {
	enrolled: boolean;
	completedLessons: number;
	xpEarned: number;
	finalized: boolean;
	lessonStates: boolean[];
}

/**
 * Client-side hook that verifies enrollment on-chain using the connected wallet.
 * Overrides server-side enrollment state when the connected wallet differs
 * from the server-derived wallet.
 */
export function useOnchainEnrollment(courseId: string, serverEnrolled?: boolean) {
	const { wallet, isWalletConnected } = useAuth();
	const [enrollment, setEnrollment] = useState<OnchainEnrollment | null>(null);
	const [loading, setLoading] = useState(false);
	const [fetchCount, setFetchCount] = useState(0);

	const walletKey = wallet.publicKey?.toBase58() ?? null;

	const refetch = () => setFetchCount((c) => c + 1);

	useEffect(() => {
		if (!isWalletConnected || !walletKey) {
			setEnrollment(null);
			return;
		}

		let cancelled = false;
		setLoading(true);

		(async () => {
			try {
				const client = getAcademyClient();
				const learner = new PublicKey(walletKey);
				const [enrollmentData, courseData] = await Promise.all([
					client.fetchEnrollment(courseId, learner),
					client.fetchCourse(courseId).catch(() => null),
				]);

				if (cancelled) return;

				if (enrollmentData && courseData) {
					const completed = countCompletedLessons(enrollmentData.lessonFlags);
					const lessonStates = Array.from(
						{ length: courseData.lessonCount },
						(_, index) => isLessonCompleted(enrollmentData.lessonFlags, index)
					);
					setEnrollment({
						enrolled: true,
						completedLessons: completed,
						xpEarned: completed * courseData.xpPerLesson,
						finalized: !!enrollmentData.completedAt,
						lessonStates,
					});
				} else if (enrollmentData) {
					setEnrollment({
						enrolled: true,
						completedLessons: countCompletedLessons(enrollmentData.lessonFlags),
						xpEarned: 0,
						finalized: !!enrollmentData.completedAt,
						lessonStates: [],
					});
				} else {
					setEnrollment(null);
				}
			} catch {
				if (!cancelled) setEnrollment(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [courseId, walletKey, isWalletConnected, fetchCount]);

	const enrolled = enrollment?.enrolled ?? serverEnrolled ?? false;

	return { enrolled, enrollment, loading, refetch };
}
