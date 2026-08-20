import "server-only";

import { ERROR_IDS } from "@/constants/errorIds";
import { logError } from "@/lib/logging";
import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Platform-behaviour aggregates for the admin Insights panel (#836).
 *
 * Everything here is an AGGREGATE: counts, sums and per-day buckets. No user
 * ids, no chat logs, no PII crosses this boundary — the panel answers "how many
 * learners lean on the AI tutor, where, and what is being completed", not "what
 * did learner X do".
 *
 * Sources are the operational tables that already exist (no schema changes):
 * `challenge_assists`, `ai_spend_ledger` (global scope), `user_progress`,
 * `enrollments` and `profiles`. Quiz correctness is deliberately absent — it is
 * not persisted server-side; the `quiz_checked` PostHog event (same issue) is
 * its home.
 *
 * SOFT-DELETED ACCOUNTS ARE EXCLUDED EVERYWHERE. `POST /api/account/delete`
 * tombstones a profile (`deleted_at` set, username anonymized, `is_public`
 * false) but the FK cascades never fire, so that learner's `enrollments`,
 * `user_progress` and `challenge_assists` rows all survive. Counting them would
 * inflate every headline number on a panel whose whole purpose is an honest
 * read — so the deleted-id set is fetched once and subtracted here.
 *
 * `deleted_at IS NULL` is the filter, NOT `is_public = true`. The public
 * surfaces (`public_profiles`, `get_leaderboard`) also require `is_public`
 * because it is a learner's privacy preference about being *listed*; a private
 * profile is still an active learner and must count in an internal total.
 */

export interface AssistRow {
  user_id: string;
  lesson_id: string;
  assists_used: number;
  billed_assists: number;
}

export interface SpendRow {
  spend_day: string;
  micro_usd: number;
  request_count: number;
}

export interface ProgressRow {
  user_id: string;
  course_id: string;
  completed_at: string | null;
}

export interface PlatformInsights {
  generatedAt: string;
  ai: {
    /** Distinct learners with at least one assist used. */
    learnersUsingAi: number;
    totalAssists: number;
    billedAssists: number;
    /** Lessons ranked by assists — a proxy for where learners struggle. */
    topLessons: { lessonId: string; assists: number; learners: number }[];
    /** Last 30 days of global AI spend, ascending by day. */
    spendByDay: { day: string; usd: number; requests: number }[];
    spend30dUsd: number;
    requests30d: number;
  };
  learning: {
    totalLearners: number;
    totalEnrollments: number;
    activeLearners7d: number;
    activeLearners30d: number;
    /** Lesson completions per UTC day, last 30 days, ascending. */
    completionsByDay: { day: string; count: number }[];
    perCourse: { courseId: string; completions: number; learners: number }[];
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` in UTC — the same bucketing `ai_spend_ledger.spend_day` uses. */
function utcDay(iso: string): string {
  return iso.slice(0, 10);
}

function microUsdToUsd(micro: number): number {
  // Round to cents; micro-USD → USD is 10^6.
  return Math.round(micro / 10_000) / 100;
}

/** Pure aggregation over pre-fetched rows — the tested core of the panel. */
export function aggregateInsights(input: {
  now: Date;
  assists: AssistRow[];
  spend: SpendRow[];
  progress: ProgressRow[];
  /** One `user_id` per enrollment row (deleted learners still included). */
  enrollments: { user_id: string }[];
  /** Soft-deleted (`profiles.deleted_at IS NOT NULL`) learner ids to exclude. */
  deletedUserIds: ReadonlySet<string>;
  /** Head-count of live profiles — already filtered by the caller. */
  totalLearners: number;
}): PlatformInsights {
  const { now, spend, deletedUserIds } = input;

  // A tombstoned learner's rows outlive the tombstone (no FK cascade on a soft
  // delete), so every per-user source is filtered through the same set.
  const isLive = (userId: string): boolean => !deletedUserIds.has(userId);
  const assists = input.assists.filter((r) => isLive(r.user_id));
  const progress = input.progress.filter((r) => isLive(r.user_id));
  const totalEnrollments = input.enrollments.filter((r) =>
    isLive(r.user_id)
  ).length;

  // --- AI ------------------------------------------------------------------
  const aiUsers = new Set<string>();
  let totalAssists = 0;
  let billedAssists = 0;
  const byLesson = new Map<string, { assists: number; users: Set<string> }>();
  for (const row of assists) {
    if (row.assists_used <= 0 && row.billed_assists <= 0) continue;
    aiUsers.add(row.user_id);
    totalAssists += row.assists_used;
    billedAssists += row.billed_assists;
    const entry = byLesson.get(row.lesson_id) ?? {
      assists: 0,
      users: new Set<string>(),
    };
    entry.assists += row.assists_used;
    entry.users.add(row.user_id);
    byLesson.set(row.lesson_id, entry);
  }
  const topLessons = [...byLesson.entries()]
    .map(([lessonId, e]) => ({
      lessonId,
      assists: e.assists,
      learners: e.users.size,
    }))
    .sort(
      (a, b) => b.assists - a.assists || a.lessonId.localeCompare(b.lessonId)
    )
    .slice(0, 10);

  const spendByDay = spend
    .map((s) => ({
      day: s.spend_day,
      usd: microUsdToUsd(s.micro_usd),
      requests: s.request_count,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const spend30dUsd =
    Math.round(spendByDay.reduce((acc, s) => acc + s.usd, 0) * 100) / 100;
  const requests30d = spendByDay.reduce((acc, s) => acc + s.requests, 0);

  // --- Learning ------------------------------------------------------------
  const cut7 = now.getTime() - 7 * DAY_MS;
  const cut30 = now.getTime() - 30 * DAY_MS;
  const active7 = new Set<string>();
  const active30 = new Set<string>();
  const dayBuckets = new Map<string, number>();
  const byCourse = new Map<
    string,
    { completions: number; users: Set<string> }
  >();

  for (const row of progress) {
    const course = byCourse.get(row.course_id) ?? {
      completions: 0,
      users: new Set<string>(),
    };
    course.completions += 1;
    course.users.add(row.user_id);
    byCourse.set(row.course_id, course);

    if (!row.completed_at) continue;
    const at = Date.parse(row.completed_at);
    if (Number.isNaN(at)) continue;
    if (at >= cut30) {
      active30.add(row.user_id);
      const day = utcDay(new Date(at).toISOString());
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
    }
    if (at >= cut7) active7.add(row.user_id);
  }

  const completionsByDay = [...dayBuckets.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const perCourse = [...byCourse.entries()]
    .map(([courseId, e]) => ({
      courseId,
      completions: e.completions,
      learners: e.users.size,
    }))
    .sort(
      (a, b) =>
        b.completions - a.completions || a.courseId.localeCompare(b.courseId)
    );

  return {
    generatedAt: now.toISOString(),
    ai: {
      learnersUsingAi: aiUsers.size,
      totalAssists,
      billedAssists,
      topLessons,
      spendByDay,
      spend30dUsd,
      requests30d,
    },
    learning: {
      totalLearners: input.totalLearners,
      totalEnrollments,
      activeLearners7d: active7.size,
      activeLearners30d: active30.size,
      completionsByDay,
      perCourse,
    },
  };
}

// Row caps: aggregate reads bounded well above today's platform size; if the
// platform outgrows them the numbers under-count instead of the query dying,
// and the cap is one place to raise.
const MAX_ROWS = 50_000;

interface RowsResult {
  data: unknown[] | null;
  error: { message: string } | null;
}
interface RawSelect extends PromiseLike<RowsResult> {
  eq(column: string, value: unknown): RawSelect;
  gte(column: string, value: unknown): RawSelect;
  limit(n: number): RawSelect;
}
/**
 * Untyped view of the admin client for `challenge_assists` and
 * `ai_spend_ledger`: the GENERATED Database types lag these two tables (added
 * by later migrations), so the typed `.from()` mis-resolves their columns. The
 * runtime schema is authoritative; rows are re-narrowed on the way out.
 */
interface RawDb {
  from(table: string): { select(columns: string): RawSelect };
}

/**
 * Same untyped escape hatch for the RPC: `get_admin_insights` post-dates the
 * generated `Database` types, and it returns a single jsonb document rather
 * than the row set `.rpc()`'s generated overloads expect.
 */
interface RpcDb {
  rpc(
    fn: string
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

function isDayCount(value: unknown): value is { day: string; count: number } {
  const v = value as { day?: unknown; count?: unknown } | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.day === "string" &&
    typeof v.count === "number"
  );
}

/**
 * Structural check on the RPC payload before it is trusted as
 * `PlatformInsights`. A jsonb round-trip arrives as `unknown`, and a
 * half-shaped payload rendering as blank cards is worse than falling back — so
 * anything failing here takes the row path instead.
 */
function isPlatformInsights(value: unknown): value is PlatformInsights {
  const v = value as PlatformInsights | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.generatedAt === "string" &&
    typeof v.ai === "object" &&
    v.ai !== null &&
    typeof v.ai.spend30dUsd === "number" &&
    Array.isArray(v.ai.spendByDay) &&
    Array.isArray(v.ai.topLessons) &&
    typeof v.learning === "object" &&
    v.learning !== null &&
    typeof v.learning.totalLearners === "number" &&
    Array.isArray(v.learning.perCourse) &&
    Array.isArray(v.learning.completionsByDay) &&
    v.learning.completionsByDay.every(isDayCount)
  );
}

/**
 * RPC-first (#1135): `get_admin_insights()` does the whole fold in SQL, so the
 * 50k row caps below stop bounding the answer. The function and this code
 * deploy independently (Vercel auto-deploys main), so an absent or failing RPC
 * falls back to the row-fetch path rather than 500-ing the panel — the same
 * arrangement `get_platform_stats` uses on the landing.
 */
export async function getPlatformInsights(
  client: ReturnType<typeof createAdminClient>
): Promise<PlatformInsights> {
  const { data, error } = await (client as unknown as RpcDb).rpc(
    "get_admin_insights"
  );

  if (!error && isPlatformInsights(data)) return data;

  logError({
    errorId: ERROR_IDS.ADMIN_INSIGHTS_RPC_FAILED,
    error: new Error(
      error?.message ?? "get_admin_insights returned no payload"
    ),
  });

  return fetchInsightsFromRows(client);
}

/**
 * The pre-#1135 path: pull the raw rows and fold them in JS. Kept as the
 * fallback, and as the reference the pglite parity test measures the RPC
 * against.
 */
async function fetchInsightsFromRows(
  client: ReturnType<typeof createAdminClient>
): Promise<PlatformInsights> {
  const now = new Date();
  const cut30Day = new Date(now.getTime() - 30 * DAY_MS)
    .toISOString()
    .slice(0, 10);

  const [profiles, deleted, enrollments, progress, assists, spend] =
    await Promise.all([
      // Live learners only — a tombstoned account is not a learner.
      client
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      // The tombstoned ids, to subtract from every per-user source below.
      client.from("profiles").select("id").not("deleted_at", "is", null),
      client.from("enrollments").select("user_id").limit(MAX_ROWS),
      client
        .from("user_progress")
        .select("user_id, course_id, completed_at")
        .eq("completed", true)
        .limit(MAX_ROWS),
      (client as unknown as RawDb)
        .from("challenge_assists")
        .select("user_id, lesson_id, assists_used, billed_assists")
        .limit(MAX_ROWS),
      (client as unknown as RawDb)
        .from("ai_spend_ledger")
        .select("spend_day, micro_usd, request_count")
        .eq("scope", "global")
        .gte("spend_day", cut30Day)
        .limit(100),
    ]);

  const firstError =
    profiles.error ??
    deleted.error ??
    enrollments.error ??
    progress.error ??
    assists.error ??
    spend.error;
  if (firstError) throw new Error(firstError.message);

  return aggregateInsights({
    now,
    assists: (assists.data ?? []) as unknown as AssistRow[],
    spend: (spend.data ?? []) as unknown as SpendRow[],
    progress: (progress.data ?? []) as ProgressRow[],
    enrollments: (enrollments.data ?? []) as { user_id: string }[],
    deletedUserIds: new Set(
      ((deleted.data ?? []) as { id: string }[]).map((r) => r.id)
    ),
    totalLearners: profiles.count ?? 0,
  });
}
