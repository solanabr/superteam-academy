import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChallengeContent } from "./challenge-content";
import { getChallengePageData } from "@/lib/challenge-content";

interface ChallengePageProps {
	params: Promise<{
		id: string;
		challengeId: string;
	}>;
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
	const { id, challengeId } = await params;
	const pageData = await getChallengePageData(id, challengeId);
	if (!pageData) {
		return {
			title: `Challenge | ${challengeId} | Superteam Academy`,
			description: "Coding challenge",
		};
	}

	const { course, challenge } = pageData;
	return {
		title: `${challenge.title} | ${course.title} | Superteam Academy`,
		description: challenge.description,
	};
}

export default async function ChallengePage({ params }: ChallengePageProps) {
	const { id, challengeId } = await params;
	const pageData = await getChallengePageData(id, challengeId);
	if (!pageData) {
		notFound();
	}

	const challengeData = {
		id: pageData.lesson.slug?.current ?? pageData.lesson._id,
		title: pageData.challenge.title,
		description: pageData.challenge.description,
		difficulty: pageData.challenge.difficulty,
		estimatedTime: pageData.challenge.estimatedTime,
		xpReward: pageData.challenge.xpReward,
		language: pageData.challenge.language,
		starterCode: pageData.challenge.starterCode,
		instructions: pageData.challenge.instructions,
		objectives: pageData.challenge.objectives,
		tests: pageData.challenge.tests,
		hints: pageData.challenge.hints,
	};

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<ChallengeSkeleton />}>
				<ChallengeContent
					courseId={id}
					courseTitle={pageData.course.title}
					challengeId={challengeId}
					challenge={challengeData}
				/>
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
