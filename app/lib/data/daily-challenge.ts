/**
 * @fileoverview Data types and Sanity fetchers for the standalone Challenges feature.
 * Completely separate from course/lesson data — challenges are independent coding exercises.
 */

import type { SanityContent } from "@/lib/data/course-detail";
import { client as sanityClient } from "@/sanity/client";

/**
 * Represents a standalone challenge (daily or regular).
 */
export interface DailyChallenge {
	_id: string;
	title: string;
	slug: string;
	description: string;
	difficulty: 1 | 2 | 3;
	category: string;
	xpReward: number;
	scheduledDate: string | null;
	content: SanityContent;
	starterCode: string;
	solutionCode: string;
	testCases: {
		name: string;
		description: string;
		status: "pass" | "fail" | "pending";
	}[];
	hints: string[];
	isActive: boolean;
}

/**
 * Card-level challenge data for listing pages.
 */
export interface ChallengeCard {
	_id: string;
	title: string;
	slug: string;
	description: string;
	difficulty: 1 | 2 | 3;
	category: string;
	xpReward: number;
	scheduledDate: string | null;
}

/**
 * User's submission record for a challenge.
 */
export interface ChallengeSubmissionData {
	id: string;
	challengeId: string;
	challengeSlug: string;
	passed: boolean;
	xpEarned: number;
	submittedAt: string;
}

const CHALLENGE_CARD_FIELDS = `
	_id,
	title,
	"slug": slug.current,
	description,
	difficulty,
	category,
	xpReward,
	scheduledDate,
	isActive
`;

const CHALLENGE_FULL_FIELDS = `
	_id,
	title,
	"slug": slug.current,
	description,
	difficulty,
	category,
	xpReward,
	scheduledDate,
	content,
	starterCode,
	solutionCode,
	testCases,
	hints,
	isActive
`;

/**
 * Fetches today's daily challenge from Sanity.
 * Falls back to the most recent past daily if none scheduled for today.
 */
export async function fetchTodaysChallenge(): Promise<DailyChallenge | null> {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

	// Try exact date match first
	let challenge = await sanityClient.fetch<DailyChallenge | null>(
		`*[_type == "dailyChallenge" && scheduledDate == $today && isActive == true][0] { ${CHALLENGE_FULL_FIELDS} }`,
		{ today },
	);

	if (challenge) return parseTestCases(challenge);

	// Fallback: most recent past scheduled challenge
	challenge = await sanityClient.fetch<DailyChallenge | null>(
		`*[_type == "dailyChallenge" && scheduledDate <= $today && isActive == true] | order(scheduledDate desc)[0] { ${CHALLENGE_FULL_FIELDS} }`,
		{ today },
	);

	return challenge ? parseTestCases(challenge) : null;
}

/**
 * Fetches all active challenges (both daily and regular).
 */
export async function fetchAllChallenges(): Promise<ChallengeCard[]> {
	return sanityClient.fetch<ChallengeCard[]>(
		`*[_type == "dailyChallenge" && isActive == true] | order(scheduledDate desc) { ${CHALLENGE_CARD_FIELDS} }`,
	);
}

/**
 * Fetches a single challenge by its slug.
 */
export async function fetchChallengeBySlug(
	slug: string,
): Promise<DailyChallenge | null> {
	const challenge = await sanityClient.fetch<DailyChallenge | null>(
		`*[_type == "dailyChallenge" && slug.current == $slug && isActive == true][0] { ${CHALLENGE_FULL_FIELDS} }`,
		{ slug },
	);

	return challenge ? parseTestCases(challenge) : null;
}

/**
 * Parses the testCases field from a JSON string (Sanity text field) into typed objects.
 */
function parseTestCases(challenge: DailyChallenge): DailyChallenge {
	if (typeof challenge.testCases === "string") {
		try {
			challenge.testCases = JSON.parse(challenge.testCases);
		} catch {
			challenge.testCases = [];
		}
	}
	return challenge;
}
