import { NextRequest, NextResponse } from "next/server";
import type { CodeBlockData, ProseBlockData } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getLessonBySlug } from "@/lib/content/queries";
import { spendAssist, refundAssist } from "@/lib/ai/assist-budget";
import { sealCheck } from "@/lib/ai/check-seal";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
  GEMINI_RESPONSE_SCHEMA,
} from "@/lib/ai/partner-prompt";
import type {
  PartnerAction,
  PartnerRequest,
  HintResponse,
  AnswerResponse,
} from "@/lib/ai/partner-types";
import { serverEnv } from "@/lib/env.server";

const GEMINI_API_KEY = serverEnv.GEMINI_API_KEY;

// Input caps for the AI Partner route.
const MAX_BODY_CHARS = 50_000;
const MAX_CODE_CHARS = 20_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_SLUG_CHARS = 256;
const MAX_TEST_SUMMARY_CHARS = 2_000;

// Model history: gemini-2.5-flash(-lite) are gated for new keys (404 "not
// available to new users") and gemini-2.0-flash is now fully retired (404 "no
// longer available"). gemini-3.5-flash is available and supports structured
// output. NOTE it's a *thinking* model — thinking tokens draw from the
// maxOutputTokens budget — so thinking is disabled in generationConfig
// (thinkingBudget: 0) to keep the whole budget for the response (esp. `propose`,
// which returns the entire updated file).
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const VALID_ACTIONS: readonly PartnerAction[] = ["hint", "propose", "ask"];

function isPartnerAction(value: string): value is PartnerAction {
  return (VALID_ACTIONS as readonly string[]).includes(value);
}

// The raw parsed JSON body, pre-validation — fields are `unknown`-shaped
// until the runtime checks below narrow them to `PartnerRequest`.
type PartnerRequestBody = Partial<Record<keyof PartnerRequest, unknown>>;

// Internal shape of a validated Gemini "propose" payload — still carries the
// answer (`correctIndex`/`explanation`) in-process. This NEVER leaves the
// route as-is: it's sealed via `sealCheck` into the client-facing
// `ProposeResponse.checkToken` before the HTTP response is built.
interface ValidatedProposeResponse {
  type: "propose";
  rationale: string;
  proposedCode: string;
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

type ValidatedResponse =
  | HintResponse
  | AnswerResponse
  | ValidatedProposeResponse;

/**
 * Runtime validation of the Gemini structured output against the expected
 * shape per `type`. `GEMINI_RESPONSE_SCHEMA` can't hard-require fields
 * conditional on `type` (Gemini's schema dialect has no such constraint), so
 * this is the actual enforcement point — a malformed or incomplete payload is
 * rejected here rather than trusted and forwarded. The "propose" branch keeps
 * `correctIndex`/`explanation` internally (see `ValidatedProposeResponse`) —
 * the caller is responsible for sealing them before responding to the client.
 */
function validatePartnerResponse(parsed: unknown): ValidatedResponse | null {
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
      question: c.question,
      options: [c.options[0], c.options[1], c.options[2]] as [
        string,
        string,
        string,
      ],
      correctIndex: c.correctIndex as 0 | 1 | 2,
      explanation: c.explanation,
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

  // The lesson's PUBLIC block projection (post-D4 there is no secret answer key).
  // The AI Partner surfaces a `code` block; the challenge solution + tests are
  // read straight from that block (same projection every reader gets, spec
  // §10.2). getLessonBySlug applies the normal catalog gate — a lesson not yet
  // live has no partner surface either.
  const lesson = await getLessonBySlug(courseSlug, lessonSlug);
  const codeBlock = lesson?.blocks.find(
    (b): b is CodeBlockData => b._type === "code"
  );
  if (!lesson || !codeBlock) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Every request that reaches this route is a PAID action — free authored
  // hints are served client-side from the block's `hints` ladder and never
  // hit this route. Spend atomically before calling Gemini so a denied budget
  // never triggers a model call. Budget is keyed by the lesson id.
  const spend = await spendAssist(user.id, lesson._id);
  if (!spend.allowed) {
    return NextResponse.json({ budgetExhausted: true, used: spend.used });
  }

  // Post-D4 every test is public; feed them all to the prompt.
  const visibleTests = codeBlock.tests.map((t) => ({
    description: t.description,
    input: t.input,
    expectedOutput: t.expectedOutput,
  }));

  // Task brief = the lesson's prose blocks (resolved markdown), joined in order.
  const task = lesson.blocks
    .filter((b): b is ProseBlockData => b._type === "prose")
    .map((b) => b.src)
    .join("\n\n");

  const prefix = buildStaticPrefix({
    task,
    visibleTests,
    solution: codeBlock.solution,
    tutorNotes: undefined,
    language: codeBlock.language,
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
          // gemini-3.5-flash is a thinking model and thinking tokens share the
          // maxOutputTokens budget; disable it so the full budget goes to the
          // structured response (and to cut latency/cost).
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini partner API error:", response.status, errorText);
      // A spend already happened above (spend.allowed was true to reach
      // here) but Gemini never ran — refund so a failed call doesn't burn
      // one of the user's 4 paid assists.
      await refundAssist(user.id, lesson._id);
      // Surface the upstream status (not Gemini's raw body) so a config-side
      // failure (403 API-not-enabled / key-restricted, 404 model, 429 quota)
      // is diagnosable from the Network tab, not just the server logs.
      return NextResponse.json(
        { error: "AI service unavailable", upstreamStatus: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log(
      "[ai/partner] cachedContentTokenCount:",
      data?.usageMetadata?.cachedContentTokenCount ?? 0
    );

    const finishReason = data?.candidates?.[0]?.finishReason;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) {
      // finishReason === "MAX_TOKENS" here means the budget was spent before any
      // visible output (raise maxTokensFor(action)); log it so it's diagnosable.
      console.error("[ai/partner] empty output", { action, finishReason });
      await refundAssist(user.id, lesson._id);
      return NextResponse.json(
        { error: "AI could not generate a response" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Usually a truncated payload (finishReason "MAX_TOKENS"): the JSON is cut
      // off mid-string. Log the reason + a snippet so the cap can be tuned.
      console.error("[ai/partner] non-JSON output", {
        action,
        finishReason,
        snippet: rawText.slice(0, 200),
      });
      await refundAssist(user.id, lesson._id);
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    const validated = validatePartnerResponse(parsed);
    if (!validated) {
      console.error("Gemini partner API returned a malformed payload");
      await refundAssist(user.id, lesson._id);
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    if (validated.type === "propose") {
      // Seal the answer server-side — the client only ever sees
      // {question, options} + an opaque checkToken. Never spread `validated`
      // here: that would leak `correctIndex`/`explanation` into the response.
      const checkToken = sealCheck({
        correctIndex: validated.correctIndex,
        explanation: validated.explanation,
      });
      return NextResponse.json({
        type: "propose",
        rationale: validated.rationale,
        proposedCode: validated.proposedCode,
        check: {
          question: validated.question,
          options: validated.options,
        },
        checkToken,
      });
    }

    return NextResponse.json(validated);
  } catch (error) {
    console.error("AI partner error:", error);
    // Same reasoning as the other post-spend failure paths: refund the spend
    // that already happened before this try block.
    await refundAssist(user.id, lesson._id);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
