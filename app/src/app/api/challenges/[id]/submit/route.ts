import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { submit_challenge_body_schema } from "@/lib/validators/challenge";
import { db } from "@/lib/db";
import { challenges, user_challenge_attempts, wallets } from "@/lib/db/schema";
import { record_streak_event } from "@/lib/services/streak-service";
import { evaluate_and_award_criteria_achievements } from "@/lib/services/achievement-service";
import { reward_xp_onchain } from "@/lib/services/blockchain-service";
import { run_challenge_tests } from "@/lib/services/challenge-runner";
import { get_challenge_by_id, is_sanity_configured } from "@/lib/services/course-service";
import { check_rate_limit } from "@/lib/security/rate-limit";

type Params = Promise<{ id: string }>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: { params: Params }): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { id } = await params;

  const rate_limit = await check_rate_limit({
    key: `challenge_submit:${result.session.sub}`,
    window_ms: 5 * 60 * 1000,
    max: 20,
  });

  if (!rate_limit.allowed) {
    return api_error("Too many requests", 429);
  }

  const body = await request.json();
  const parsed = submit_challenge_body_schema.safeParse(body);
  if (!parsed.success) return api_error("Invalid body", 400);

  const { solution_code } = parsed.data;
  const { session } = result;

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_error("Wallet not linked", 400);
  }

  let challengeDetail: {
    id: string;
    xp_reward: number;
    test_cases: Array<{ input: string; expected: string }>;
    language: string;
  };
  let isExternal: boolean;

  if (is_sanity_configured()) {
    const sanityChallenge = await get_challenge_by_id(id, false);
    if (sanityChallenge) {
      challengeDetail = {
        id: sanityChallenge.id,
        xp_reward: sanityChallenge.xp_reward,
        test_cases: sanityChallenge.test_cases,
        language: sanityChallenge.language,
      };
      isExternal = true;
    } else if (UUID_REGEX.test(id)) {
      const [dbRow] = await db
        .select()
        .from(challenges)
        .where(and(eq(challenges.id, id), isNull(challenges.deleted_at)))
        .limit(1);
      if (!dbRow) return api_error("Challenge not found", 404);
      challengeDetail = {
        id: dbRow.id,
        xp_reward: dbRow.xp_reward,
        test_cases: dbRow.test_cases ?? [],
        language: dbRow.language,
      };
      isExternal = false;
    } else {
      return api_error("Challenge not found", 404);
    }
  } else {
    if (!UUID_REGEX.test(id)) return api_error("Challenge not found", 404);
    const [dbRow] = await db
      .select()
      .from(challenges)
      .where(and(eq(challenges.id, id), isNull(challenges.deleted_at)))
      .limit(1);
    if (!dbRow) return api_error("Challenge not found", 404);
    challengeDetail = {
      id: dbRow.id,
      xp_reward: dbRow.xp_reward,
      test_cases: dbRow.test_cases ?? [],
      language: dbRow.language,
    };
    isExternal = false;
  }

  const now = new Date();

  const previousPassCondition = isExternal
    ? and(
        eq(user_challenge_attempts.user_id, session.sub),
        eq(user_challenge_attempts.external_challenge_id, id),
        eq(user_challenge_attempts.passed, true),
      )
    : and(
        eq(user_challenge_attempts.user_id, session.sub),
        eq(user_challenge_attempts.challenge_id, id),
        eq(user_challenge_attempts.passed, true),
      );

  const [previousPass] = await db
    .select()
    .from(user_challenge_attempts)
    .where(previousPassCondition)
    .limit(1);

  if (previousPass) {
    return api_success(
      { passed: true, xp_awarded: previousPass.xp_awarded },
      "Challenge already completed",
      200,
    );
  }

  const run = await run_challenge_tests(solution_code, {
    test_cases: challengeDetail.test_cases,
    language: challengeDetail.language,
  });
  const passed = run.passed;
  let xp_awarded = 0;

  let tx_signature: string | null = null;
  if (passed && challengeDetail.xp_reward > 0) {
    xp_awarded = challengeDetail.xp_reward;
    tx_signature = await reward_xp_onchain({
      wallet_public_key: wallet.public_key,
      amount: xp_awarded,
      reason: "challenge",
      challenge_id: challengeDetail.id,
    });
  }

  await db.insert(user_challenge_attempts).values({
    user_id: session.sub,
    challenge_id: isExternal ? null : id,
    external_challenge_id: isExternal ? id : null,
    solution_code,
    passed,
    xp_awarded,
    attempted_at: now,
    submitted_at: now,
    updated_at: now,
  });

  if (passed) {
    await record_streak_event(session.sub, "challenge_complete", now);
    await evaluate_and_award_criteria_achievements(session.sub);
  }

  return api_success({ passed, xp_awarded }, "Challenge submission recorded", 200);
}
