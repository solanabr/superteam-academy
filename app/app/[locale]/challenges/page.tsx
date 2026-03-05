/**
 * @fileoverview Challenges Hub page — standalone challenges separate from courses.
 * Lists daily + regular challenges with filtering, XP rewards, and analytics tracking.
 */

import * as Sentry from "@sentry/nextjs";
import { getTranslations } from "next-intl/server";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import {
	getAllChallenges,
	getUserChallengeHistory,
} from "@/lib/actions/daily-challenge";
import { getSessionServer } from "@/lib/auth/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { ChallengesListClient } from "./ChallengesListClient";

/**
 * Server component for the Challenges hub page.
 */
export default async function ChallengesPage() {
	const t = await getTranslations("Challenges");
	const session = await getSessionServer();

	// Track page view server-side
	try {
		if (session) {
			const posthog = getPostHogClient();
			posthog.capture({
				distinctId: session.user.id,
				event: "challenges_page_viewed",
				properties: { user_email: session.user.email },
			});
			await posthog.shutdown();
		}
	} catch (error) {
		Sentry.captureException(error);
	}

	const [challenges, history] = await Promise.all([
		getAllChallenges(),
		getUserChallengeHistory(),
	]).catch((err) => {
		Sentry.captureException(err);
		return [[], []];
	});

	// Build a set of completed challenge slugs
	const completedSlugs = new Set(
		history.filter((h) => h.passed).map((h) => h.challengeSlug),
	);

	// Separate today's daily, upcoming scheduled, and regular challenges
	const today = new Date().toISOString().split("T")[0];

	// Find exact match for today OR fallback to the most recent past one
	const dailyChallenge =
		challenges.find((c) => c.scheduledDate === today) ||
		[...challenges]
			.filter((c) => c.scheduledDate && c.scheduledDate < today)
			.sort((a, b) => b.scheduledDate!.localeCompare(a.scheduledDate!))[0] ||
		challenges.find((c) => !c.scheduledDate) || // If no scheduled ones, pick a regular one
		null;

	const upcomingChallenges = challenges.filter(
		(c) => c.scheduledDate && c.scheduledDate > today && c !== dailyChallenge,
	);

	const regularChallenges = challenges.filter(
		(c) => !upcomingChallenges.includes(c),
	);

	return (
		<div className="min-h-screen bg-bg-base">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				{/* Top Bar */}
				<div className="col-span-1 lg:col-span-2">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Content */}
				<main className="px-4 py-6 lg:px-8 lg:py-8 overflow-visible lg:overflow-y-auto relative z-10">
					<DotGrid />

					{/* Page Header */}
					<div className="mb-8 lg:mb-12 relative z-10">
						<div className="mb-6 border-b border-ink-secondary/20 dark:border-border pb-4 relative">
							<span className="bg-ink-primary text-bg-base px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-3">
								{t("badge")}
							</span>
							<h1 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px] sm:text-[36px] lg:text-[48px]">
								{t("title")}
							</h1>
							<p className="text-ink-secondary text-sm mt-3 max-w-xl font-mono">
								{t("subtitle")}
							</p>
							<div className="absolute bottom-[-3px] right-0 w-full h-px border-b border-dashed border-ink-secondary/20 dark:border-border" />
						</div>
					</div>

					{/* Client component for interactive filtering */}
					<ChallengesListClient
						dailyChallenge={dailyChallenge}
						upcomingChallenges={upcomingChallenges}
						regularChallenges={regularChallenges}
						completedSlugs={Array.from(completedSlugs)}
					/>
				</main>
			</div>
		</div>
	);
}
