import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import {
  clampDailyChallengeTimerMinutes,
  clampDailyChallengeXp,
  getUtcDateKey,
  type DailyChallenge,
  type DailyChallengeLanguage,
} from "@/lib/services/daily-challenge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SanityDailyTestCase {
  id?: string;
  name?: string;
  input?: string;
  expected?: string;
}

interface SanityDailyChallenge {
  _id: string;
  title?: string;
  challengeDate?: string;
  description?: string;
  language?: DailyChallengeLanguage;
  starterCode?: string;
  solutionCode?: string;
  testCases?: SanityDailyTestCase[];
  hints?: string[];
  xpReward?: number;
  timeLimitMinutes?: number;
}

const DAILY_CHALLENGE_BY_DATE_QUERY = `*[_type == "dailyChallenge" && !(_id in path("drafts.**")) && challengeDate == $date] | order(_updatedAt desc)[0] {
  _id,
  title,
  challengeDate,
  description,
  language,
  starterCode,
  solutionCode,
  testCases[]{id, name, input, expected},
  hints,
  xpReward,
  timeLimitMinutes
}`;

const DAILY_CHALLENGE_FALLBACK_QUERY = `*[_type == "dailyChallenge" && !(_id in path("drafts.**")) && challengeDate <= $date] | order(challengeDate desc, _updatedAt desc)[0] {
  _id,
  title,
  challengeDate,
  description,
  language,
  starterCode,
  solutionCode,
  testCases[]{id, name, input, expected},
  hints,
  xpReward,
  timeLimitMinutes
}`;

const DAILY_CHALLENGE_ANY_PUBLISHED_QUERY = `*[_type == "dailyChallenge" && !(_id in path("drafts.**"))] | order(challengeDate desc, _updatedAt desc)[0] {
  _id,
  title,
  challengeDate,
  description,
  language,
  starterCode,
  solutionCode,
  testCases[]{id, name, input, expected},
  hints,
  xpReward,
  timeLimitMinutes
}`;

function normalizeChallenge(doc: SanityDailyChallenge | null): DailyChallenge | null {
  if (!doc || !doc.title || !doc.description || !doc.starterCode || !doc.solutionCode) {
    return null;
  }

  const testCases = (doc.testCases ?? [])
    .filter((testCase) => typeof testCase?.name === "string" && typeof testCase?.expected === "string")
    .map((testCase, index) => ({
      id: (testCase.id?.trim() || `t${index + 1}`).slice(0, 32),
      name: testCase.name!.trim().slice(0, 120),
      input: typeof testCase.input === "string" ? testCase.input : "",
      expected: testCase.expected!,
    }));

  if (testCases.length === 0) {
    return null;
  }

  return {
    id: doc._id,
    date: doc.challengeDate ?? getUtcDateKey(),
    title: doc.title.slice(0, 140),
    description: doc.description,
    language:
      doc.language === "rust"
        ? "rust"
        : doc.language === "json"
          ? "json"
          : "typescript",
    xpReward: clampDailyChallengeXp(doc.xpReward),
    starterCode: doc.starterCode,
    solutionCode: doc.solutionCode,
    hints: Array.isArray(doc.hints)
      ? doc.hints.filter((hint): hint is string => typeof hint === "string" && hint.trim().length > 0)
      : [],
    testCases,
    timeLimitMinutes: clampDailyChallengeTimerMinutes(doc.timeLimitMinutes),
  };
}

function isUtcDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get("date");
  const date = isUtcDate(requestedDate) ? requestedDate : getUtcDateKey();

  try {
    const exactDoc = await sanityClient.fetch<SanityDailyChallenge | null>(
      DAILY_CHALLENGE_BY_DATE_QUERY,
      { date },
      { cache: "no-store" }
    );

    const exact = normalizeChallenge(exactDoc);
    if (exact) {
      return NextResponse.json({ challenge: exact }, { status: 200 });
    }

    const fallbackDoc = await sanityClient.fetch<SanityDailyChallenge | null>(
      DAILY_CHALLENGE_FALLBACK_QUERY,
      { date },
      { cache: "no-store" }
    );

    const fallback = normalizeChallenge(fallbackDoc);
    if (fallback) {
      return NextResponse.json({ challenge: fallback }, { status: 200 });
    }

    const latestPublishedDoc = await sanityClient.fetch<SanityDailyChallenge | null>(
      DAILY_CHALLENGE_ANY_PUBLISHED_QUERY,
      {},
      { cache: "no-store" }
    );
    const latestPublished = normalizeChallenge(latestPublishedDoc);
    if (latestPublished) {
      return NextResponse.json({ challenge: latestPublished }, { status: 200 });
    }

    return NextResponse.json(
      { error: `No published daily challenge found for ${date}.` },
      { status: 404 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch daily challenge.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
