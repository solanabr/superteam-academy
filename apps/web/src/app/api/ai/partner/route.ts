import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getChallengeAnswerKey, getLessonBySlug } from "@/lib/sanity/queries";
import { spendAssist } from "@/lib/ai/assist-budget";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
  GEMINI_RESPONSE_SCHEMA,
} from "@/lib/ai/partner-prompt";
import type {
  PartnerAction,
  PartnerRequest,
  PartnerResponse,
} from "@/lib/ai/partner-types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Input caps for the AI Partner route.
const MAX_BODY_CHARS = 50_000;
const MAX_CODE_CHARS = 20_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_SLUG_CHARS = 256;
const MAX_TEST_SUMMARY_CHARS = 2_000;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const VALID_ACTIONS: readonly PartnerAction[] = ["hint", "propose", "ask"];

function isPartnerAction(value: string): value is PartnerAction {
  return (VALID_ACTIONS as readonly string[]).includes(value);
}

// The raw parsed JSON body, pre-validation — fields are `unknown`-shaped
// until the runtime checks below narrow them to `PartnerRequest`.
type PartnerRequestBody = Partial<Record<keyof PartnerRequest, unknown>>;

/**
 * Runtime validation of the Gemini structured output against the
 * `PartnerResponse` discriminated union. `GEMINI_RESPONSE_SCHEMA` can't
 * hard-require fields conditional on `type` (Gemini's schema dialect has no
 * such constraint), so this is the actual enforcement point — a malformed or
 * incomplete payload is rejected here rather than trusted and forwarded.
 */
function validatePartnerResponse(parsed: unknown): PartnerResponse | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  if (obj.type === "hint" || obj.type === "answer") {
    if (typeof obj.text !== "string" || obj.text.length === 0) return null;
    return { type: obj.type, text: obj.text };
  }

  if (obj.type === "propose") {
    if (typeof obj.rationale !== "string" || obj.rationale.length === 0)
      return null;
    if (typeof obj.proposedCode !== "string" || obj.proposedCode.length === 0)
      return null;

    const check = obj.check;
    if (!check || typeof check !== "object") return null;
    const c = check as Record<string, unknown>;

    if (typeof c.question !== "string" || c.question.length === 0) return null;
    if (
      !Array.isArray(c.options) ||
      c.options.length !== 3 ||
      !c.options.every((o) => typeof o === "string" && o.length > 0)
    )
      return null;
    if (
      typeof c.correctIndex !== "number" ||
      !Number.isInteger(c.correctIndex) ||
      c.correctIndex < 0 ||
      c.correctIndex > 2
    )
      return null;
    if (typeof c.explanation !== "string" || c.explanation.length === 0)
      return null;

    return {
      type: "propose",
      rationale: obj.rationale,
      proposedCode: obj.proposedCode,
      check: {
        question: c.question,
        options: [c.options[0], c.options[1], c.options[2]] as [
          string,
          string,
          string,
        ],
        correctIndex: c.correctIndex as 0 | 1 | 2,
        explanation: c.explanation,
      },
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI partner not configured" },
      { status: 503 }
    );
  }

  // Require an authenticated user.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cap the raw body before parsing to reject oversized payloads.
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: PartnerRequestBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { lessonSlug, courseSlug, action, message, code, testSummary } = body;

  if (
    typeof lessonSlug !== "string" ||
    typeof courseSlug !== "string" ||
    typeof action !== "string" ||
    typeof code !== "string" ||
    typeof testSummary !== "string" ||
    !lessonSlug ||
    !courseSlug ||
    !code ||
    !isPartnerAction(action)
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Enforce per-field input caps on the user-authored fields.
  if (
    code.length > MAX_CODE_CHARS ||
    lessonSlug.length > MAX_SLUG_CHARS ||
    courseSlug.length > MAX_SLUG_CHARS ||
    testSummary.length > MAX_TEST_SUMMARY_CHARS ||
    (message !== undefined &&
      (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS))
  ) {
    return NextResponse.json(
      { error: "Input exceeds maximum allowed size" },
      { status: 413 }
    );
  }

  // Per-user rate limit (abuse mitigation only — fails open, NOT the cost
  // ceiling; the fail-closed assist budget below is).
  if (
    await isRateLimited("ai:partner", user.id, {
      maxTokens: 20,
      refillIntervalMs: 60_000,
    })
  ) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Server-authoritative answer key (solution + full test set, never trust
  // client-supplied values) plus the public lesson record for the challenge
  // task/brief text shown in the prompt. Both are looked up by identity
  // (courseSlug/lessonSlug); getChallengeAnswerKey is intentionally ungated
  // (same as grading) while getLessonBySlug applies the normal catalog gate —
  // a lesson not yet live has no partner surface either.
  const [answerKey, lesson] = await Promise.all([
    getChallengeAnswerKey(courseSlug, lessonSlug),
    getLessonBySlug(courseSlug, lessonSlug),
  ]);
  if (!answerKey || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Every request that reaches this route is a PAID action — free authored
  // hints are served client-side from the lesson's `hints` ladder and never
  // hit this route (design resolution, Task 3 → progress.md). Spend
  // atomically before calling Gemini so a denied budget never triggers a
  // model call.
  const spend = await spendAssist(user.id, answerKey._id);
  if (!spend.allowed) {
    return NextResponse.json({ budgetExhausted: true, used: spend.used });
  }

  // Hidden tests must NEVER enter the prompt — only visible tests + solution.
  const visibleTests = answerKey.tests
    .filter((t) => t.hidden !== true)
    .map((t) => ({
      description: t.description,
      input: t.input,
      expectedOutput: t.expectedOutput,
    }));

  const prefix = buildStaticPrefix({
    task: typeof lesson.content === "string" ? lesson.content : "",
    visibleTests,
    solution: answerKey.solution ?? "",
    tutorNotes: answerKey.tutorNotes ?? undefined,
    language: answerKey.language ?? "",
  });
  const suffix = buildDynamicSuffix({
    lessonSlug,
    courseSlug,
    action,
    message,
    code,
    testSummary,
  });

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prefix + "\n\n" + suffix }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: maxTokensFor(action),
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini partner API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log(
      "[ai/partner] cachedContentTokenCount:",
      data?.usageMetadata?.cachedContentTokenCount ?? 0
    );

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) {
      return NextResponse.json(
        { error: "AI could not generate a response" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Gemini partner API returned non-JSON output");
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    const validated = validatePartnerResponse(parsed);
    if (!validated) {
      console.error("Gemini partner API returned a malformed payload");
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    return NextResponse.json(validated);
  } catch (error) {
    console.error("AI partner error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
