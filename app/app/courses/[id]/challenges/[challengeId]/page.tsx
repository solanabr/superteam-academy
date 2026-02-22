import { Suspense, lazy } from "react";
import type { Metadata } from "next";

const ChallengeContent = lazy(() =>
	import("@/app/[locale]/courses/[id]/challenges/[challengeId]/challenge-content").then(
		(mod) => ({ default: mod.ChallengeContent })
	)
);

interface ChallengePageProps {
	params: Promise<{
		id: string;
		challengeId: string;
	}>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
	const { challengeId } = await params;
	return {
		title: `Challenge | ${challengeId} | Superteam Academy`,
		description: "Complete coding challenges to earn XP and advance your skills",
	};
}

export default async function ChallengePage({ params }: ChallengePageProps) {
	const { id, challengeId } = await params;
	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ChallengeSkeleton />}>
				<ChallengeContent courseId={id} challengeId={challengeId} />
			</Suspense>
		</div>
	);
}

function ChallengeSkeleton() {
	return (
		<div className="flex flex-col lg:flex-row min-h-screen">
			<div className="flex-1 flex flex-col">
				<div className="border-b p-4">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<div className="h-6 w-48 bg-muted animate-pulse rounded" />
							<div className="h-4 w-32 bg-muted animate-pulse rounded" />
						</div>
						<div className="h-8 w-20 bg-muted animate-pulse rounded" />
					</div>
				</div>

				<div className="flex-1 p-6 space-y-4">
					<div className="h-8 w-64 bg-muted animate-pulse rounded" />
					<div className="space-y-2">
						<div className="h-4 w-full bg-muted animate-pulse rounded" />
						<div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
						<div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
					</div>
				</div>
			</div>

			<div className="w-full lg:w-80 border-l p-4 space-y-6">
				<div className="space-y-4">
					<div className="h-32 bg-muted animate-pulse rounded" />
					<div className="h-48 bg-muted animate-pulse rounded" />
				</div>
			</div>
		</div>
	);
}
