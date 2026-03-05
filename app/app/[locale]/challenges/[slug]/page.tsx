/**
 * @fileoverview Challenge detail page — renders a standalone challenge using the ChallengeView interface.
 * Adapts standalone challenge data to the Lesson interface shape to reuse existing challenge components.
 * Includes PostHog, GA4, and Sentry analytics.
 */
import { notFound } from "next/navigation";
import { getChallenge } from "@/lib/actions/daily-challenge";
import { getSessionServer } from "@/lib/auth/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { ChallengeDetailClient } from "./ChallengeDetailClient";

interface ChallengePageProps {
	params: Promise<{ slug: string }>;
}

export default async function ChallengePage({ params }: ChallengePageProps) {
	const { slug } = await params;
	const challenge = await getChallenge(slug);

	if (!challenge) {
		notFound();
	}

	// Track page view server-side
	const session = await getSessionServer();
	if (session) {
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: session.user.id,
			event: "challenge_detail_viewed",
			properties: {
				challenge_slug: slug,
				challenge_title: challenge.title,
				challenge_difficulty: challenge.difficulty,
				challenge_category: challenge.category,
			},
		});
		await posthog.shutdown();
	}

	// Parse test cases for the client
	const testCases = Array.isArray(challenge.testCases)
		? challenge.testCases.map((tc) => ({
				name: tc.name || "Test",
				description: tc.description || "",
				status: "pending" as const,
			}))
		: [];

	return (
		<ChallengeDetailClient
			challenge={{
				_id: challenge._id,
				title: challenge.title,
				slug: challenge.slug,
				description: challenge.description,
				difficulty: challenge.difficulty,
				category: challenge.category,
				xpReward: challenge.xpReward,
				scheduledDate: challenge.scheduledDate,
				content: challenge.content,
				starterCode: challenge.starterCode,
				solutionCode: challenge.solutionCode,
				hints: challenge.hints || [],
				testCases,
				isActive: challenge.isActive,
			}}
		/>
	);
}
