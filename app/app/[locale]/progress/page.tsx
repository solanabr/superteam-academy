import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicKey } from "@solana/web3.js";
import { getProgramId, getSolanaConnection } from "@/lib/academy";
import { getLinkedWallet } from "@/lib/auth";
import { ProgressTracking } from "@/components/progress/progress-tracking";
import { LearningProgressService } from "@/services/learning-progress-service";
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
	const service = new LearningProgressService(connection, programId);
	const snapshot = await service.getLearnerProgressSnapshot(learner);
	const totalXp = snapshot.totalXp;

	const level = calculateLevelFromXP(totalXp);
	const nextLevelXP = (level + 1) ** 2 * 100;

	return (
		<ProgressTracking
			courses={snapshot.courses}
			achievements={snapshot.achievements}
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
