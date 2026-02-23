import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicKey } from "@solana/web3.js";
import { findToken2022ATA } from "@superteam-academy/solana";
import { countCompletedLessons } from "@superteam-academy/anchor";
import { getAcademyClient, getProgramId, getSolanaConnection } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { ProgressTracking } from "@/components/progress/progress-tracking";
import { AchievementService } from "@/services/achievement-service";
import { calculateLevelFromXP } from "@superteam-academy/gamification";

export const metadata: Metadata = {
	title: "Learning Progress | Superteam Academy",
	description: "Track your on-chain learning progress, courses, and achievements.",
};

export default async function ProgressPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto px-4 sm:px-6 py-8">
				<Suspense fallback={<ProgressSkeleton />}>
					<ProgressContent />
				</Suspense>
			</div>
		</div>
	);
}

async function ProgressContent() {
	const wallet = await getLinkedWallet();
	if (!wallet) {
		return (
			<div className="text-center py-16 text-muted-foreground">
				Connect a wallet to view your learning progress.
			</div>
		);
	}

	const learner = new PublicKey(wallet);
	const connection = getSolanaConnection();
	const programId = getProgramId();
	const client = getAcademyClient();

	const [config, allCourses, enrollments] = await Promise.all([
		client.fetchConfig(),
		client.fetchAllCourses(),
		client.fetchEnrollmentsForLearner(learner),
	]);

	let totalXp = 0;
	if (config?.xpMint) {
		const ata = findToken2022ATA(learner, config.xpMint);
		const balance = await client.fetchXpBalance(ata);
		totalXp = Number(balance ?? 0n);
	}

	const courseMap = new Map(allCourses.map((c) => [c.pubkey.toBase58(), c.account]));

	const courses = enrollments.map((entry) => {
		const course = courseMap.get(entry.account.course.toBase58());
		const completed = countCompletedLessons(entry.account.lessonFlags);
		const total = course?.lessonCount ?? 0;
		return {
			courseId: course?.courseId ?? entry.pubkey.toBase58(),
			courseTitle: course?.courseId ?? "Course",
			totalLessons: total,
			completedLessons: completed,
			xpEarned: completed * (course?.xpPerLesson ?? 0),
			timeSpent: completed * 10,
			lastActivity: new Date(entry.account.enrolledAt * 1000),
			streak: 0,
		};
	});

	const level = calculateLevelFromXP(totalXp);
	const nextLevelXP = (level + 1) ** 2 * 100;

	const achievementService = new AchievementService(connection, programId);
	const rawAchievements = await achievementService.getLearnerAchievements(learner);
	const achievements = rawAchievements
		.filter((a) => a.earned && a.awardedAt)
		.map((a) => ({
			id: a.achievementId,
			title: a.name,
			description: a.metadataUri,
			icon: "trophy",
			unlockedAt: new Date((a.awardedAt as number) * 1000),
			rarity: "common" as const,
		}));

	return (
		<ProgressTracking
			courses={courses}
			achievements={achievements}
			totalXP={totalXp}
			currentLevel={level}
			nextLevelXP={nextLevelXP}
			streak={0}
		/>
	);
}

function ProgressSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
				))}
			</div>
			<div className="h-40 bg-muted animate-pulse rounded-xl" />
			<div className="h-64 bg-muted animate-pulse rounded-xl" />
		</div>
	);
}
