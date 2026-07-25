import { NextRequest, NextResponse } from "next/server";
import type { OpenEndedBlockData } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { getLessonByIdForGrading } from "@/lib/content/queries";
import { sealAttestation } from "@/lib/ai/check-seal";
import { maybeGenerateReflectionReply } from "@/lib/ai/reflection-reply";
import { isRateLimited } from "@/lib/rate-limit";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

// The submission receipt for a required-but-ungraded `openEnded` reflection
// block (spec §3 item 6). `/api/lessons/complete` demands a sealed attestation
// for such blocks and `sealAttestation` had no caller — so those lessons 403'd
// forever. This route is that caller.
//
// Receipt-first ruling: a valid submission returns the seal UNCONDITIONALLY. The
// AI reply is best-effort enrichment (`maybeGenerateReflectionReply`, default
// off) that may fail, be rate-limited, or be disabled without ever blocking the
// seal. The lesson must always be completable (AIE-21 — degrade never block).

const MAX_BODY_CHARS = 20_000;
const MAX_ID_CHARS = 100;
// A hard char ceiling independent of maxWords — the byte cap of the submission.
// maxWords tops out at 500 (open-ended.ts), so this only rejects pathological
// input, not any legitimate reflection.
const MAX_REFLECTION_CHARS = 10_000;
const DEFAULT_MAX_WORDS = 200;

// The attestation only proves the server saw a submission; it is bound to
// {lessonId, blockKey, userId} so it cannot be replayed across any of them. The
// TTL bounds staleness only — generous so a learner who reflects, reads on, then
// clicks "Mark complete" much later is never forced to resubmit.
const ATTESTATION_TTL_MS = 24 * 60 * 60 * 1000;

interface ReflectRequest {
  courseId: string;
  lessonId: string;
  blockKey: string;
  text: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    let body: Partial<Record<keyof ReflectRequest, unknown>>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { courseId, lessonId, blockKey, text } = body;
    if (
      typeof courseId !== "string" ||
      typeof lessonId !== "string" ||
      typeof blockKey !== "string" ||
      typeof text !== "string" ||
      !courseId ||
      !lessonId ||
      !blockKey ||
      courseId.length > MAX_ID_CHARS ||
      lessonId.length > MAX_ID_CHARS ||
      blockKey.length > MAX_ID_CHARS
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (text.length > MAX_REFLECTION_CHARS) {
      return NextResponse.json(
        { error: "Reflection too long" },
        { status: 413 }
      );
    }

    // Cheap per-user limiter. A throttled request 429s (retryable) — the seal is
    // never made permanently unobtainable, only deferred. Unlike
    // /api/lessons/complete this path funds no on-chain write, so a per-IP key
    // (which would 429 a NAT'd classroom) is unnecessary here.
    if (
      await isRateLimited("lessons:reflect", user.id, {
        maxTokens: 30,
        refillIntervalMs: 60_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many reflections. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Server-authoritative resolution: the lesson must exist in the committed
    // bundle for this course, and the block must be a real `openEnded` block.
    const lesson = await getLessonByIdForGrading(courseId, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const block = lesson.blocks.find((b) => b.key === blockKey);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    if (block._type !== "openEnded") {
      return NextResponse.json(
        { error: "Block is not a reflection" },
        { status: 400 }
      );
    }

    const maxWords =
      (block as OpenEndedBlockData).maxWords ?? DEFAULT_MAX_WORDS;
    const words = countWords(text);
    if (words === 0 || words > maxWords) {
      return NextResponse.json(
        { error: "Reflection does not meet the length requirement" },
        { status: 400 }
      );
    }

    // The receipt. Bound to {courseId, lessonId, blockKey, userId} + expiry so it
    // is the exact shape /api/lessons/complete verifies via openAttestation.
    // Computed and returned regardless of whether the AI reply below succeeds.
    const seal = sealAttestation({
      courseId,
      lessonId,
      blockKey,
      userId: user.id,
      exp: Date.now() + ATTESTATION_TTL_MS,
    });

    // Best-effort enrichment. The helper never touches the assist-budget ledger
    // and resolves to null on failure/disabled/rate-limit; the extra try/catch
    // keeps the receipt-first guarantee LOCAL — the seal is returned even if the
    // reply path ever throws, rather than relying on the helper's discipline.
    let reply: string | null = null;
    try {
      reply = await maybeGenerateReflectionReply({
        userId: user.id,
        prompt: (block as OpenEndedBlockData).prompt,
        reflection: text,
      });
    } catch {
      reply = null;
    }

    return NextResponse.json({ seal, reply });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.LESSON_REFLECT_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/lessons/reflect" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
