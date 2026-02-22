# Helius Webhook Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace dual-write (on-chain + Supabase) architecture with event-driven Helius raw webhooks, Supabase Realtime for frontend notifications, and a DAS-powered resync endpoint.

**Architecture:** Helius raw webhook watches the Academy program address. Every successful TX triggers a POST to `/api/webhooks/helius`, which decodes Anchor events from raw logs and routes them to per-event handlers that write to Supabase. API routes are stripped to on-chain-only. Frontend popups are triggered by Supabase Realtime subscriptions instead of synchronous API responses.

**Tech Stack:** Helius webhooks (raw), `@coral-xyz/anchor` BorshEventCoder, Supabase Realtime (postgres_changes), Helius DAS API (getAssetsByOwner), existing `award_xp()` / `unlock_achievement()` SECURITY DEFINER functions.

**Design Doc:** `docs/plans/2026-02-22-helius-webhook-migration-design.md`

---

## Phase 1: Helius Types & Event Decoder

### Task 1: Create Helius webhook TypeScript types

**Files:**

- Create: `apps/web/src/lib/helius/types.ts`

**Step 1: Create the types file**

```typescript
/**
 * Helius raw webhook payload types.
 * Raw webhooks deliver the full Solana transaction as-is.
 * Ref: https://docs.helius.dev/webhooks/webhook-types#raw
 */

/** A single raw transaction as delivered by Helius */
export interface HeliusRawTransaction {
  /** Full transaction object from Solana RPC */
  transaction: {
    signatures: string[];
    message: {
      accountKeys: string[];
      instructions: {
        programIdIndex: number;
        accounts: number[];
        data: string;
      }[];
      recentBlockhash: string;
    };
  };
  meta: {
    err: null | Record<string, unknown>;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    logMessages: string[];
    innerInstructions: {
      index: number;
      instructions: {
        programIdIndex: number;
        accounts: number[];
        data: string;
      }[];
    }[];
  } | null;
}

/** The webhook POST body is an array of transactions */
export type HeliusWebhookPayload = HeliusRawTransaction[];

/** Decoded Anchor event with typed data */
export interface DecodedEvent<T = Record<string, unknown>> {
  name: string;
  data: T;
}

/** Typed event data for each program event */
export interface LessonCompletedEvent {
  learner: string;
  course: string;
  lessonIndex: number;
  xpEarned: number;
  timestamp: number;
}

export interface EnrolledEvent {
  learner: string;
  course: string;
  courseVersion: number;
  timestamp: number;
}

export interface CourseFinalizedEvent {
  learner: string;
  course: string;
  totalXp: number;
  bonusXp: number;
  creator: string;
  creatorXp: number;
  timestamp: number;
}

export interface EnrollmentClosedEvent {
  learner: string;
  course: string;
  completed: boolean;
  rentReclaimed: number;
  timestamp: number;
}

export interface CredentialIssuedEvent {
  learner: string;
  trackId: number;
  credentialAsset: string;
  currentLevel: number;
  timestamp: number;
}

export interface CredentialUpgradedEvent {
  learner: string;
  trackId: number;
  credentialAsset: string;
  currentLevel: number;
  timestamp: number;
}

export interface AchievementAwardedEvent {
  achievementId: string;
  recipient: string;
  asset: string;
  xpReward: number;
  timestamp: number;
}

export interface XpRewardedEvent {
  minter: string;
  recipient: string;
  amount: number;
  memo: string;
  timestamp: number;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/helius/types.ts
git commit -m "feat(helius): add TypeScript types for raw webhook payload and decoded events"
```

---

### Task 2: Create Anchor event decoder

**Files:**

- Create: `apps/web/src/lib/helius/event-decoder.ts`
- Reference: `apps/web/src/lib/solana/idl/superteam_academy.json` (existing IDL)

Anchor events are emitted as `Program data: <base64>` in transaction log messages.
The first 8 bytes of the decoded base64 are the event discriminator (SHA256 of `event:<EventName>`).
`BorshEventCoder` from `@coral-xyz/anchor` handles this.

**Step 1: Create the decoder**

```typescript
import { BorshEventCoder, Idl } from "@coral-xyz/anchor";
import IDL from "@/lib/solana/idl/superteam_academy.json";
import type { DecodedEvent, HeliusRawTransaction } from "./types";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID!;
const eventCoder = new BorshEventCoder(IDL as unknown as Idl);

/**
 * Extract and decode all Anchor events from a raw Helius transaction.
 *
 * Anchor emits events via `sol_log_data` which appears in transaction logs as:
 *   "Program data: <base64-encoded event>"
 *
 * We filter logs to find entries from our program, extract the base64 data,
 * and decode each one using the IDL's BorshEventCoder.
 */
export function decodeEventsFromTransaction(tx: HeliusRawTransaction): {
  events: DecodedEvent[];
  signature: string;
} {
  const signature = tx.transaction.signatures[0];
  const logs = tx.meta?.logMessages ?? [];

  if (tx.meta?.err) {
    return { events: [], signature };
  }

  const events: DecodedEvent[] = [];
  let insideOurProgram = false;

  for (const log of logs) {
    // Track when we enter/exit our program's execution context
    if (log.includes(`Program ${PROGRAM_ID} invoke`)) {
      insideOurProgram = true;
      continue;
    }
    if (
      log.includes(`Program ${PROGRAM_ID} success`) ||
      log.includes(`Program ${PROGRAM_ID} failed`)
    ) {
      insideOurProgram = false;
      continue;
    }

    // Only decode "Program data:" lines emitted while inside our program
    if (insideOurProgram && log.startsWith("Program data: ")) {
      const base64Data = log.slice("Program data: ".length);
      try {
        const decoded = eventCoder.decode(base64Data);
        if (decoded) {
          events.push({
            name: decoded.name,
            data: decoded.data as Record<string, unknown>,
          });
        }
      } catch {
        // Not one of our events — skip silently
      }
    }
  }

  return { events, signature };
}

/**
 * Normalize Anchor event data from BN/PublicKey to plain strings/numbers.
 * BorshEventCoder returns BN for integers and PublicKey for pubkeys.
 */
export function normalizeEventData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toBase58" in value) {
      // PublicKey → string
      normalized[key] = (value as { toBase58(): string }).toBase58();
    } else if (value && typeof value === "object" && "toNumber" in value) {
      // BN → number
      normalized[key] = (value as { toNumber(): number }).toNumber();
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/helius/event-decoder.ts
git commit -m "feat(helius): add Anchor event decoder for raw webhook logs"
```

---

### Task 3: Create resolution helpers (wallet → user_id, course PDA → course_id)

**Files:**

- Create: `apps/web/src/lib/helius/resolvers.ts`
- Reference: `apps/web/src/lib/supabase/admin.ts` (existing admin client)
- Reference: `apps/web/src/lib/solana/academy-reads.ts` (existing on-chain readers)

**Step 1: Create resolvers**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, Idl } from "@coral-xyz/anchor";
import IDL from "@/lib/solana/idl/superteam_academy.json";

const coder = new BorshCoder(IDL as unknown as Idl);

/**
 * Resolve a wallet address to a Supabase user_id.
 * Returns null if no profile found (manual program interaction).
 */
export async function resolveUserId(
  walletAddress: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();
  return data?.id ?? null;
}

/** Cache for course PDA → course_id lookups within a single webhook invocation */
const coursePdaCache = new Map<string, string>();

/**
 * Resolve a course PDA (Pubkey) to its string course_id.
 * Fetches the on-chain Course account and reads the course_id field.
 * Cached per webhook invocation to avoid redundant RPC calls.
 */
export async function resolveCourseId(
  coursePda: string,
  connection: Connection
): Promise<string | null> {
  if (coursePdaCache.has(coursePda)) {
    return coursePdaCache.get(coursePda)!;
  }

  try {
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(coursePda)
    );
    if (!accountInfo) return null;

    const decoded = coder.accounts.decode("Course", accountInfo.data);
    const courseId = decoded.courseId as string;
    coursePdaCache.set(coursePda, courseId);
    return courseId;
  } catch {
    return null;
  }
}

/**
 * Resolve lesson_index to lesson_id using Sanity course structure.
 * Flattens modules → lessons and returns the lesson at the given index.
 */
export async function resolveLessonId(
  courseId: string,
  lessonIndex: number
): Promise<string | null> {
  // Dynamic import to avoid pulling Sanity client into non-page contexts
  const { getCourseByIdWithModules } = await import("@/lib/sanity/queries");
  try {
    const course = await getCourseByIdWithModules(courseId);
    if (!course) return null;
    const allLessons = (course.modules ?? []).flatMap(
      (m: { lessons?: { _id: string }[] }) => m.lessons ?? []
    );
    return allLessons[lessonIndex]?._id ?? null;
  } catch {
    return null;
  }
}

/** Clear the course PDA cache (call between webhook invocations if needed) */
export function clearCoursePdaCache(): void {
  coursePdaCache.clear();
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/helius/resolvers.ts
git commit -m "feat(helius): add wallet/course/lesson resolution helpers"
```

---

## Phase 2: Event Handlers

### Task 4: Create per-event handler functions

**Files:**

- Create: `apps/web/src/lib/helius/event-handlers.ts`
- Reference: `apps/web/src/lib/supabase/admin.ts`
- Reference: `apps/web/src/lib/solana/academy-program.ts` (backend-signer functions)
- Reference: `apps/web/src/lib/gamification/achievements.ts` (checkNewAchievements)
- Reference: `apps/web/src/lib/solana/academy-reads.ts` (fetchEnrollment)
- Reference: `apps/web/src/lib/solana/bitmap.ts` (isAllLessonsComplete)
- Reference: `supabase/schema.sql` (award_xp, unlock_achievement functions)

This is the largest file. It contains one handler function per event type.

**Step 1: Create event handlers**

```typescript
import { Connection } from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserId, resolveCourseId, resolveLessonId } from "./resolvers";
import type {
  LessonCompletedEvent,
  EnrolledEvent,
  CourseFinalizedEvent,
  EnrollmentClosedEvent,
  CredentialIssuedEvent,
  AchievementAwardedEvent,
  XpRewardedEvent,
} from "./types";

// Backend-signer functions for on-chain calls from the webhook
import {
  finalizeCourse as onChainFinalizeCourse,
  issueCredential as onChainIssueCredential,
  awardAchievement as onChainAwardAchievement,
  getConnection,
} from "@/lib/solana/academy-program";

import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isAllLessonsComplete } from "@/lib/solana/bitmap";
import { checkNewAchievements } from "@/lib/gamification/achievements";
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

/** Queue a failed backend-signed on-chain TX for retry */
async function queueFailedAction(
  userId: string,
  actionType: string,
  referenceId: string,
  payload: Record<string, unknown>,
  error: string
) {
  const supabase = createAdminClient();
  await supabase.from("pending_onchain_actions").insert({
    user_id: userId,
    action_type: actionType,
    reference_id: referenceId,
    payload,
    last_error: error,
  });
}

// ─── Enrolled ─────────────────────────────────────────────

export async function handleEnrolled(
  event: EnrolledEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();
  await supabase.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date(event.timestamp * 1000).toISOString(),
      tx_signature: txSignature,
      wallet_address: event.learner,
    },
    { onConflict: "user_id,course_id" }
  );
}

// ─── EnrollmentClosed ─────────────────────────────────────

export async function handleEnrollmentClosed(
  event: EnrollmentClosedEvent,
  _txSignature: string
) {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();
  await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId);
}

// ─── LessonCompleted ──────────────────────────────────────

export async function handleLessonCompleted(
  event: LessonCompletedEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const lessonId = await resolveLessonId(courseId, event.lessonIndex);

  const supabase = createAdminClient();

  // 1. Upsert user_progress
  if (lessonId) {
    await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date(event.timestamp * 1000).toISOString(),
        tx_signature: txSignature,
        lesson_index: event.lessonIndex,
      },
      { onConflict: "user_id,lesson_id" }
    );
  }

  // 2. Award XP via SECURITY DEFINER function
  if (event.xpEarned > 0) {
    await supabase.rpc("award_xp", {
      p_user_id: userId,
      p_amount: event.xpEarned,
      p_reason: `Completed lesson: ${lessonId ?? event.lessonIndex}`,
      p_idempotency_key: `${txSignature}:LessonCompleted`,
      p_tx_signature: txSignature,
    });
  }

  // 3. Check if all lessons complete → finalize on-chain
  await checkAndFinalize(event, userId, courseId, connection);

  // 4. Check achievement eligibility → award on-chain
  await checkAndAwardAchievements(userId, event.learner, courseId);
}

/** Check if all lessons are complete and trigger finalize_course on-chain */
async function checkAndFinalize(
  event: LessonCompletedEvent,
  userId: string,
  courseId: string,
  connection: Connection
) {
  try {
    const learnerPk = new PublicKey(event.learner);
    const enrollment = await fetchEnrollment(
      courseId,
      learnerPk,
      connection,
      PROGRAM_ID
    );
    if (!enrollment || enrollment.completedAt) return; // Already finalized

    const course = await fetchCourse(courseId, connection, PROGRAM_ID);
    if (!course) return;

    const allDone = isAllLessonsComplete(
      enrollment.lessonFlags,
      course.lessonCount
    );
    if (!allDone) return;

    await onChainFinalizeCourse(courseId, learnerPk);
    // CourseFinalized event will arrive as a separate webhook
  } catch (err) {
    await queueFailedAction(
      userId,
      "finalize",
      courseId,
      {
        courseId,
        wallet: event.learner,
      },
      String(err)
    );
  }
}

/** Check achievement eligibility and award on-chain */
async function checkAndAwardAchievements(
  userId: string,
  walletAddress: string,
  courseId: string
) {
  try {
    const supabase = createAdminClient();

    // Fetch user state for achievement checks
    const [xpResult, progressResult, achievementsResult, enrollmentsResult] =
      await Promise.all([
        supabase
          .from("user_xp")
          .select("total_xp, current_streak")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_progress")
          .select("lesson_id, course_id")
          .eq("user_id", userId)
          .eq("completed", true),
        supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", userId),
        supabase
          .from("enrollments")
          .select("course_id, completed_at")
          .eq("user_id", userId)
          .not("completed_at", "is", null),
      ]);

    const alreadyUnlocked = (achievementsResult.data ?? []).map(
      (a) => a.achievement_id
    );

    // Fetch deployed achievements from Sanity
    const { getDeployedAchievements } = await import("@/lib/sanity/queries");
    const deployedAchievements = await getDeployedAchievements();

    const state = {
      completedLessons: progressResult.data?.length ?? 0,
      completedCourses: enrollmentsResult.data?.length ?? 0,
      currentStreak: xpResult.data?.current_streak ?? 0,
      // These require more context — check course tags from Sanity
      hasCompletedRustLesson: false, // TODO: derive from Sanity course tags
      hasCompletedAnchorCourse: false,
      hasCompletedAllTracks: false,
      courseCompletionTimeHours: null,
      allTestsPassedFirstTry: false,
      userNumber: 0,
    };

    const newAchievements = checkNewAchievements(
      deployedAchievements,
      state,
      alreadyUnlocked
    );

    // Award each achievement on-chain
    for (const achievement of newAchievements) {
      try {
        await onChainAwardAchievement(
          achievement.id,
          new PublicKey(walletAddress)
        );
        // AchievementAwarded event will arrive as a separate webhook
      } catch (err) {
        await queueFailedAction(
          userId,
          "achievement",
          achievement.id,
          {
            achievementId: achievement.id,
            wallet: walletAddress,
          },
          String(err)
        );
      }
    }
  } catch (err) {
    console.error("[webhook] Achievement check failed:", err);
  }
}

// ─── CourseFinalized ──────────────────────────────────────

export async function handleCourseFinalized(
  event: CourseFinalizedEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();

  // 1. Update enrollment completion
  await supabase
    .from("enrollments")
    .update({ completed_at: new Date(event.timestamp * 1000).toISOString() })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  // 2. Award bonus XP
  if (event.bonusXp > 0) {
    await supabase.rpc("award_xp", {
      p_user_id: userId,
      p_amount: Number(event.bonusXp),
      p_reason: `Completed course: ${courseId}`,
      p_idempotency_key: `${txSignature}:CourseFinalized:bonus`,
      p_tx_signature: txSignature,
    });
  }

  // 3. Issue credential on-chain
  await issueCredentialForCourse(userId, event, courseId, connection);
}

/** Issue a Metaplex Core credential NFT after course finalization */
async function issueCredentialForCourse(
  userId: string,
  event: CourseFinalizedEvent,
  courseId: string,
  connection: Connection
) {
  try {
    const learnerPk = new PublicKey(event.learner);

    // Check if credential already issued
    const enrollment = await fetchEnrollment(
      courseId,
      learnerPk,
      connection,
      PROGRAM_ID
    );
    if (enrollment?.credentialAsset) return; // Already minted

    // Fetch course metadata from Sanity for credential
    const { getCourseById } = await import("@/lib/sanity/queries");
    const sanityCourse = await getCourseById(courseId);
    if (!sanityCourse?.trackCollectionAddress) return;

    const trackCollectionPk = new PublicKey(
      sanityCourse.trackCollectionAddress
    );

    // Build metadata JSON
    const metadataJson = {
      name: `Solarium: ${(sanityCourse.title ?? courseId).slice(0, 20)}`,
      symbol: "STACAD",
      description: `Certificate of completion for ${sanityCourse.title ?? courseId}`,
      image: "",
      attributes: [
        { trait_type: "Course", value: sanityCourse.title ?? courseId },
        {
          trait_type: "Completion Date",
          value: new Date(event.timestamp * 1000).toISOString().split("T")[0],
        },
        { trait_type: "Recipient", value: event.learner },
        { trait_type: "Platform", value: "Solarium" },
      ],
      external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificates`,
    };

    // Store metadata in Supabase
    const supabase = createAdminClient();
    const { data: metaRow } = await supabase
      .from("nft_metadata")
      .insert({ data: metadataJson })
      .select("id")
      .single();

    if (!metaRow) return;

    const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata?id=${metaRow.id}`;
    const credentialName = `Solarium: ${(sanityCourse.title ?? courseId).slice(0, 20)}`;

    const result = await onChainIssueCredential(
      courseId,
      learnerPk,
      credentialName,
      metadataUri,
      1,
      event.totalXp,
      trackCollectionPk
    );

    // Mirror to certificates table
    await supabase.from("certificates").upsert(
      {
        user_id: userId,
        course_id: courseId,
        course_title: sanityCourse.title ?? courseId,
        mint_address: result.mintAddress.toBase58(),
        metadata_uri: metadataUri,
        minted_at: new Date().toISOString(),
        tx_signature: result.signature,
        credential_type: "core",
      },
      { onConflict: "user_id,course_id" }
    );
    // CredentialIssued event will also arrive as a separate webhook (handled idempotently)
  } catch (err) {
    await queueFailedAction(
      userId,
      "credential",
      courseId,
      {
        courseId,
        wallet: event.learner,
      },
      String(err)
    );
  }
}

// ─── CredentialIssued ─────────────────────────────────────

export async function handleCredentialIssued(
  event: CredentialIssuedEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  // The certificate may already be in Supabase (inserted by handleCourseFinalized).
  // This handler ensures it's there even if the CourseFinalized handler was the one
  // that issued the credential but failed on the Supabase insert.
  // Since certificates has ON CONFLICT (user_id, course_id) DO NOTHING, this is safe.
  // Note: CredentialIssued doesn't contain course_id directly — only track_id.
  // The certificate should already exist from handleCourseFinalized. Log only here.
  console.log(
    `[webhook] CredentialIssued: learner=${event.learner} asset=${event.credentialAsset} track=${event.trackId}`
  );
}

// ─── AchievementAwarded ───────────────────────────────────

export async function handleAchievementAwarded(
  event: AchievementAwardedEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.recipient);
  if (!userId) return;

  const supabase = createAdminClient();
  await supabase.rpc("unlock_achievement", {
    p_user_id: userId,
    p_achievement_id: event.achievementId,
    p_tx_signature: txSignature,
    p_asset_address: event.asset,
  });
}

// ─── XpRewarded (generic minter XP awards) ────────────────

export async function handleXpRewarded(
  event: XpRewardedEvent,
  txSignature: string
) {
  const userId = await resolveUserId(event.recipient);
  if (!userId) return;

  const supabase = createAdminClient();
  await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: Number(event.amount),
    p_reason: event.memo || "XP reward",
    p_idempotency_key: `${txSignature}:XpRewarded`,
    p_tx_signature: txSignature,
  });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/helius/event-handlers.ts
git commit -m "feat(helius): add per-event handler functions for all program events"
```

---

## Phase 3: Webhook Route

### Task 5: Create the webhook API route

**Files:**

- Create: `apps/web/src/app/api/webhooks/helius/route.ts`
- Reference: `apps/web/src/lib/helius/event-decoder.ts`
- Reference: `apps/web/src/lib/helius/event-handlers.ts`
- Reference: `apps/web/src/lib/helius/types.ts`

**Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  decodeEventsFromTransaction,
  normalizeEventData,
} from "@/lib/helius/event-decoder";
import {
  handleEnrolled,
  handleEnrollmentClosed,
  handleLessonCompleted,
  handleCourseFinalized,
  handleCredentialIssued,
  handleAchievementAwarded,
  handleXpRewarded,
} from "@/lib/helius/event-handlers";
import type { HeliusWebhookPayload } from "@/lib/helius/types";

const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // 1. Validate auth header
  const authHeader = req.headers.get("authorization");
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let transactions: HeliusWebhookPayload;
  try {
    transactions = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(transactions)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }

  // 3. Process each transaction
  for (const tx of transactions) {
    const { events, signature } = decodeEventsFromTransaction(tx);

    for (const event of events) {
      const data = normalizeEventData(event.data);
      try {
        switch (event.name) {
          case "Enrolled":
            await handleEnrolled(data as any, signature);
            break;
          case "EnrollmentClosed":
            await handleEnrollmentClosed(data as any, signature);
            break;
          case "LessonCompleted":
            await handleLessonCompleted(data as any, signature);
            break;
          case "CourseFinalized":
            await handleCourseFinalized(data as any, signature);
            break;
          case "CredentialIssued":
            await handleCredentialIssued(data as any, signature);
            break;
          case "AchievementAwarded":
            await handleAchievementAwarded(data as any, signature);
            break;
          case "XpRewarded":
            await handleXpRewarded(data as any, signature);
            break;
          default:
            // Admin events (CourseCreated, ConfigUpdated, etc.) — log only
            console.log(`[webhook] ${event.name}: sig=${signature}`);
        }
      } catch (err) {
        console.error(`[webhook] Error handling ${event.name}:`, err);
        // Don't return 500 for individual event failures — process remaining events.
        // Helius will retry the entire payload if we return non-200.
        // Individual failures are handled by the queue in each handler.
      }
    }
  }

  // Return 200 to acknowledge receipt (prevents Helius retry)
  return NextResponse.json({ received: true });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/api/webhooks/helius/route.ts
git commit -m "feat(helius): add webhook API route with auth, decode, and event routing"
```

---

### Task 6: Create webhook registration helper

**Files:**

- Create: `apps/web/src/lib/helius/webhook-config.ts`

This helper registers/updates the Helius webhook. Run manually or from an admin script.

**Step 1: Create the config helper**

```typescript
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

function getHeliusBaseUrl(): string {
  return NETWORK === "mainnet-beta"
    ? "https://api-mainnet.helius-rpc.com"
    : "https://api-devnet.helius-rpc.com";
}

export async function registerWebhook(webhookUrl: string) {
  if (!HELIUS_API_KEY || !PROGRAM_ID || !WEBHOOK_SECRET) {
    throw new Error(
      "Missing HELIUS_API_KEY, PROGRAM_ID, or HELIUS_WEBHOOK_SECRET"
    );
  }

  const res = await fetch(
    `${getHeliusBaseUrl()}/v0/webhooks?api-key=${HELIUS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ["ANY"],
        accountAddresses: [PROGRAM_ID],
        webhookType: "raw",
        authHeader: `Bearer ${WEBHOOK_SECRET}`,
        txnStatus: "success",
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register webhook: ${res.status} ${body}`);
  }

  return res.json();
}

export async function listWebhooks() {
  if (!HELIUS_API_KEY) throw new Error("Missing HELIUS_API_KEY");

  const res = await fetch(
    `${getHeliusBaseUrl()}/v0/webhooks?api-key=${HELIUS_API_KEY}`
  );
  return res.json();
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/helius/webhook-config.ts
git commit -m "feat(helius): add webhook registration helper for Helius API"
```

---

## Phase 4: Slim Down API Routes

### Task 7: Strip `/api/lessons/complete` to on-chain only

**Files:**

- Modify: `apps/web/src/app/api/lessons/complete/route.ts` (currently ~743 lines → ~80 lines)

The route keeps: auth check, enrollment verification, on-chain `complete_lesson` call, return signature.
The route removes: all Supabase writes, achievement checks, credential minting, streak/level calculation, retry queue logic.

**Step 1: Rewrite the route**

Strip the file to only: auth → enrollment check → on-chain call → return.
Keep the imports for `completeLesson` from `academy-program.ts`.
Remove all imports for Supabase writes, achievement logic, credential issuance.
The response becomes `{ success: true, signature }` — no XP, level, achievements (those come via Supabase Realtime now).

**Step 2: Verify the route still works**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds with no type errors.

**Step 3: Commit**

```bash
git add apps/web/src/app/api/lessons/complete/route.ts
git commit -m "refactor: strip lessons/complete to on-chain only (webhook handles Supabase)"
```

---

### Task 8: Remove sync calls from enroll/unenroll hooks

**Files:**

- Modify: `apps/web/src/hooks/use-on-chain-enroll.ts` (~line 100)
- Modify: `apps/web/src/hooks/use-on-chain-unenroll.ts` (~line 100)

**Step 1: Remove the `/api/enrollment/sync` fetch call from both hooks**

In `use-on-chain-enroll.ts`: remove the `fetch("/api/enrollment/sync", ...)` block (~lines 100-107) and its error handling. The hook should just submit the on-chain TX and return.

In `use-on-chain-unenroll.ts`: same — remove the sync fetch block.

**Step 2: Build to verify**

Run: `cd apps/web && pnpm build`
Expected: No type errors.

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-on-chain-enroll.ts apps/web/src/hooks/use-on-chain-unenroll.ts
git commit -m "refactor: remove enrollment sync calls from hooks (webhook handles sync)"
```

---

### Task 9: Delete dead API routes

**Files:**

- Delete: `apps/web/src/app/api/enrollment/sync/route.ts`
- Delete: `apps/web/src/app/api/credentials/issue/route.ts`
- Delete: `apps/web/src/app/api/courses/[courseId]/finalize/route.ts`

**Step 1: Delete the files**

These routes are fully replaced by the webhook handler.

**Step 2: Search for any remaining imports or references**

Run: `grep -r "enrollment/sync\|credentials/issue\|courseId.*finalize" apps/web/src/ --include="*.ts" --include="*.tsx"`
Fix any remaining references.

**Step 3: Build to verify**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add -u
git commit -m "refactor: delete dead sync routes replaced by Helius webhook"
```

---

## Phase 5: Frontend — Supabase Realtime Notifications

### Task 10: Enable Supabase Realtime on gamification tables

**Files:**

- Apply Supabase migration (via MCP or SQL)

**Step 1: Apply migration to enable Realtime**

```sql
-- Enable Realtime on gamification tables
-- (Supabase Realtime must be enabled per-table)
ALTER PUBLICATION supabase_realtime ADD TABLE user_xp;
ALTER PUBLICATION supabase_realtime ADD TABLE xp_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE certificates;
```

Apply via Supabase MCP `apply_migration` tool or Supabase dashboard.

**Step 2: Commit migration file if using local migrations**

```bash
git commit -m "feat(supabase): enable Realtime on gamification tables"
```

---

### Task 11: Create `useGamificationEvents` hook

**Files:**

- Create: `apps/web/src/hooks/use-gamification-events.ts`
- Reference: `apps/web/src/components/gamification/xp-popup.tsx` (dispatchXpGain)
- Reference: `apps/web/src/components/gamification/level-up-overlay.tsx` (dispatchLevelUp)
- Reference: `apps/web/src/components/gamification/achievement-popup.tsx` (dispatchAchievementUnlock)
- Reference: `apps/web/src/components/gamification/certificate-popup.tsx` (dispatchCertificateMinted)

The hook subscribes to Supabase Realtime `postgres_changes` and calls the existing `dispatch*` functions. The popup components stay unchanged — they already listen to CustomEvents.

**Step 1: Create the hook**

```typescript
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dispatchXpGain } from "@/components/gamification/xp-popup";
import { dispatchLevelUp } from "@/components/gamification/level-up-overlay";
import { dispatchAchievementUnlock } from "@/components/gamification/achievement-popup";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";

/**
 * Subscribe to Supabase Realtime for gamification events.
 * Dispatches browser CustomEvents that the existing popup components listen to.
 * Must be called with a valid userId (authenticated user).
 */
export function useGamificationEvents(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`gamification:${userId}`)
      // XP changes → detect level-up and XP gain
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_xp",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldLevel = (payload.old as { level?: number }).level ?? 0;
          const newLevel = (payload.new as { level?: number }).level ?? 0;
          if (newLevel > oldLevel) {
            dispatchLevelUp(newLevel);
          }
        }
      )
      // New XP transactions → XP popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const amount = (payload.new as { amount?: number }).amount;
          if (amount && amount > 0) {
            dispatchXpGain(amount);
          }
        }
      )
      // New achievements → achievement popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_achievements",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            achievement_id?: string;
          };
          if (row.achievement_id) {
            // Name will be resolved by the popup component from achievement-meta
            dispatchAchievementUnlock(row.achievement_id, row.achievement_id);
          }
        }
      )
      // New certificates → certificate popup
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "certificates",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { id?: string };
          if (row.id) {
            dispatchCertificateMinted(row.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/use-gamification-events.ts
git commit -m "feat: add useGamificationEvents hook for Supabase Realtime popups"
```

---

### Task 12: Wire Realtime hook into GamificationOverlays

**Files:**

- Modify: `apps/web/src/components/gamification/gamification-overlays.tsx`

**Step 1: Add the `useGamificationEvents` hook call**

Import the hook and call it inside the component with the current user's ID. The existing popup components don't change — they already listen to the same CustomEvents that the new hook dispatches.

```typescript
import { useGamificationEvents } from "@/hooks/use-gamification-events";

// Inside the GamificationOverlays component:
useGamificationEvents(user?.id);
```

**Step 2: Update lesson-client.tsx to NOT dispatch popups from API response**

Modify: `apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx`

Remove the block (~lines 368-395) that calls `dispatchXpGain`, `dispatchLevelUp`, `dispatchCertificateMinted`, `dispatchAchievementUnlock` after the API response. These are now triggered by Supabase Realtime.

The lesson completion handler should just show a "Transaction confirmed" toast.

**Step 3: Build and verify**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/components/gamification/gamification-overlays.tsx
git add apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx
git commit -m "feat: wire Supabase Realtime to gamification popups, remove sync dispatches"
```

---

## Phase 6: Environment & Config

### Task 13: Update environment configuration

**Files:**

- Modify: `apps/web/.env.example` (or `.env.local.example`)

**Step 1: Add new environment variables**

```bash
# Helius
HELIUS_API_KEY=               # API key for webhook management + DAS API
HELIUS_WEBHOOK_SECRET=        # Secret for webhook auth header validation
```

Note: `NEXT_PUBLIC_SOLANA_RPC_URL` already points to Helius (`https://devnet.helius-rpc.com/?api-key=...`). The `HELIUS_API_KEY` is the same key but used server-side for webhook management and DAS API calls.

**Step 2: Commit**

```bash
git add apps/web/.env.example
git commit -m "chore: add Helius webhook env vars to .env.example"
```

---

## Phase 7: DAS Resync Endpoint

### Task 14: Create admin resync route

**Files:**

- Create: `apps/web/src/app/api/admin/resync/route.ts`
- Reference: `apps/web/src/lib/supabase/admin.ts`

This endpoint uses the Helius DAS API (`getAssetsByOwner`) to rebuild Supabase from on-chain state. Used for migration and disaster recovery.

**Step 1: Create the resync route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT_ADDRESS!);
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export async function POST(req: NextRequest) {
  // Admin auth
  const authHeader = req.headers.get("authorization");
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { walletAddress } = await req.json();
  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const connection = new Connection(RPC_URL);
  const wallet = new PublicKey(walletAddress);

  // Resolve user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No profile for wallet" },
      { status: 404 }
    );
  }

  const results = { xp: 0, achievements: 0, certificates: 0 };

  // 1. Sync XP balance from Token-2022 ATA
  try {
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const balance = Number(account.amount);
    await supabase
      .from("user_xp")
      .upsert(
        { user_id: profile.id, total_xp: balance },
        { onConflict: "user_id" }
      );
    results.xp = balance;
  } catch {
    // ATA doesn't exist — user has 0 XP
  }

  // 2. Sync NFT assets via Helius DAS API
  if (HELIUS_API_KEY) {
    try {
      const dasRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "resync",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
          },
        }),
      });

      const dasData = await dasRes.json();
      const assets = dasData.result?.items ?? [];

      for (const asset of assets) {
        // Check if it's one of our assets by looking at authority/collection
        // This is a simplified version — production should filter by known collections
        const attrs = asset.content?.metadata?.attributes ?? [];
        const achievementAttr = attrs.find(
          (a: { trait_type: string }) => a.trait_type === "achievement_id"
        );

        if (achievementAttr) {
          await supabase.rpc("unlock_achievement", {
            p_user_id: profile.id,
            p_achievement_id: achievementAttr.value,
            p_asset_address: asset.id,
          });
          results.achievements++;
        }
      }
    } catch (err) {
      console.error("[resync] DAS API error:", err);
    }
  }

  return NextResponse.json({ synced: true, wallet: walletAddress, ...results });
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/api/admin/resync/route.ts
git commit -m "feat: add DAS-powered admin resync endpoint for migration/recovery"
```

---

## Phase 8: Integration Testing & Migration

### Task 15: Manual integration test

**No files created — manual verification steps.**

**Step 1: Register the Helius webhook**

Use the webhook-config helper or call the Helius API directly:

```bash
curl -X POST "https://api-devnet.helius-rpc.com/v0/webhooks?api-key=<HELIUS_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookURL": "https://<your-vercel-url>/api/webhooks/helius",
    "transactionTypes": ["ANY"],
    "accountAddresses": ["<PROGRAM_ID>"],
    "webhookType": "raw",
    "authHeader": "Bearer <HELIUS_WEBHOOK_SECRET>",
    "txnStatus": "success"
  }'
```

**Step 2: Test enrollment**

Enroll in a course via the frontend. Verify:

- On-chain Enrollment PDA created
- Helius webhook fires
- `enrollments` table row appears in Supabase

**Step 3: Test lesson completion**

Complete a lesson. Verify:

- On-chain bitmap updated + XP minted
- Webhook fires → `user_progress` row created, `award_xp()` called
- Frontend shows XP popup via Supabase Realtime (not API response)

**Step 4: Test course finalization + credential**

Complete all lessons in a course. Verify:

- Webhook detects all lessons done → calls `finalize_course` on-chain
- `CourseFinalized` webhook fires → `enrollments.completed_at` updated
- Credential minted → `CredentialIssued` webhook fires → `certificates` row created
- Frontend shows certificate popup

**Step 5: Test achievement**

Trigger an achievement condition (e.g., first lesson = "First Steps"). Verify:

- Webhook detects eligibility → calls `award_achievement` on-chain
- `AchievementAwarded` webhook fires → `user_achievements` row created
- Frontend shows achievement popup

**Step 6: Test unenrollment**

Unenroll from a course. Verify:

- On-chain Enrollment PDA closed
- Webhook fires → `enrollments` row deleted

**Step 7: Commit any fixes discovered during testing**

---

### Task 16: Run resync to verify parity

**Step 1: Run resync for a test wallet**

```bash
curl -X POST "https://<your-url>/api/admin/resync" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "<test-wallet>"}'
```

Verify the response counts match what's in Supabase.

---

## Summary

| Phase                | Tasks | Key Output                                                |
| -------------------- | ----- | --------------------------------------------------------- |
| 1. Types & Decoder   | 1-3   | `lib/helius/types.ts`, `event-decoder.ts`, `resolvers.ts` |
| 2. Event Handlers    | 4     | `lib/helius/event-handlers.ts` (all 7 handlers)           |
| 3. Webhook Route     | 5-6   | `api/webhooks/helius/route.ts`, `webhook-config.ts`       |
| 4. Slim API Routes   | 7-9   | Stripped `lessons/complete`, deleted 3 routes             |
| 5. Frontend Realtime | 10-12 | Supabase Realtime enabled, `useGamificationEvents` hook   |
| 6. Environment       | 13    | `HELIUS_API_KEY`, `HELIUS_WEBHOOK_SECRET` in env          |
| 7. DAS Resync        | 14    | `api/admin/resync/route.ts`                               |
| 8. Integration Test  | 15-16 | Manual verification of full flow                          |
