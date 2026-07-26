import { NextRequest, NextResponse } from "next/server";
import type { CodeBlockData, ProseBlockData } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { getLessonBySlug } from "@/lib/content/queries";
import {
  spendAssist,
  refundAssist,
  recordBilledAssist,
  appendAssistLog,
} from "@/lib/ai/assist-budget";
import { sealCheck } from "@/lib/ai/check-seal";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
  responseSchemaFor,
  MAX_PROPOSE_EDITS,
  MAX_REVIEW_NOTES,
} from "@/lib/ai/partner-prompt";
import type {
  PartnerAction,
  PartnerRequest,
  PartnerResponse,
  PartnerMessage,
  HintResponse,
  AnswerResponse,
  ReviewResponse,
  CodeEdit,
} from "@/lib/ai/partner-types";
import { serverEnv } from "@/lib/env.server";

const GEMINI_API_KEY = serverEnv.GEMINI_API_KEY;

// Input caps for the AI Partner route. MAX_CODE_CHARS is 8,000 (was 20,000):
// paired with diff-propose it collapses AIE-11's truncation lever — a smaller
// buffer to inflate, and the model no longer echoes it. No client mirrors this
// cap today; the route returns a semantically-correct 413 on overflow.
const MAX_BODY_CHARS = 50_000;
const MAX_CODE_CHARS = 8_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_SLUG_CHARS = 256;
const MAX_TEST_SUMMARY_CHARS = 2_000;

// Model history: gemini-2.5-flash(-lite) are gated for new keys (404 "not
// available to new users") and gemini-2.0-flash is now fully retired (404 "no
// longer available"). gemini-3.5-flash is available and supports structured
// output. NOTE it's a *thinking* model — thinking tokens draw from the
// maxOutputTokens budget — so thinking is disabled in generationConfig
// (thinkingBudget: 0) to keep the whole budget for the structured response.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const VALID_ACTIONS: readonly PartnerAction[] = [
  "hint",
  "propose",
  "ask",
  "review",
];

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
  edits: CodeEdit[];
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

// Narrow the Gemini `edits` array. Each entry must be an object with a NON-empty
// string `search` (empty is unlocatable) and a string `replace` (empty is a
// valid deletion). Rejects a missing/empty/oversized list. The route does not
// apply the edits — the client does, against the live buffer — but it still
// enforces shape so a malformed payload 502s here rather than reaching the UI.
function validateEdits(value: unknown): CodeEdit[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > MAX_PROPOSE_EDITS) return null;
  const edits: CodeEdit[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const e = item as Record<string, unknown>;
    if (typeof e.search !== "string" || e.search.length === 0) return null;
    if (typeof e.replace !== "string") return null;
    edits.push({ search: e.search, replace: e.replace });
  }
  return edits;
}

type ValidatedResponse =
  | HintResponse
  | AnswerResponse
  | ReviewResponse
  | ValidatedProposeResponse;

/**
 * Runtime validation of the Gemini structured output against the expected
 * shape per `type`. The per-action `responseSchemaFor` already constrains the
 * fields at the model, but this remains the authoritative enforcement point —
 * a malformed or truncated payload is rejected here rather than trusted and
 * forwarded. The "propose" branch keeps
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

  if (obj.type === "review") {
    // summary must be present; notes may be empty (already idiomatic) but every
    // entry must be a non-empty string, and the list is re-bounded here even
    // though the schema caps it — a malformed/oversized payload 502s rather than
    // forwarding unbounded text. Truncate defensively to the same ceiling.
    if (typeof obj.summary !== "string" || obj.summary.length === 0)
      return null;
    if (!Array.isArray(obj.notes)) return null;
    if (!obj.notes.every((n) => typeof n === "string" && n.length > 0))
      return null;
    return {
      type: "review",
      summary: obj.summary,
      notes: (obj.notes as string[]).slice(0, MAX_REVIEW_NOTES),
    };
  }

  if (obj.type === "propose") {
    if (typeof obj.rationale !== "string" || obj.rationale.length === 0)
      return null;
    const edits = validateEdits(obj.edits);
    if (!edits) return null;

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
      edits,
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

  // Rate limit this route fail-CLOSED — it spends a platform-funded Gemini key,
  // so a limiter-store outage must DENY, not wave traffic through unmetered (the
  // rest of the app's limiters stay fail-open; only cost-critical callers opt
  // in). Two dimensions, both required and both fail-closed:
  //   • per-user bounds one account hammering the route;
  //   • per-IP bounds an ACTOR — wallet sign-up is free, so per-user keys cannot
  //     bound Sybils where every fresh account is a fresh bucket (the exact
  //     reason /api/lessons/complete carries both).
  if (
    await isRateLimited("ai:partner", user.id, {
      maxTokens: 20,
      refillIntervalMs: 60_000,
      failClosed: true,
    })
  ) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Per-IP ceiling, sized off the worst LEGITIMATE case, not a round number: a
  // bootcamp cohort (~60) or a CGNAT'd BR mobile carrier behind one NAT, each
  // learner holding MAX_PAID_ASSISTS paid assists per lesson. A fixed window is
  // a cliff, not a throttle, so undershooting 429s a whole classroom at once;
  // 600/min clears that with headroom while still bounding a Sybil actor's burn
  // rate from a single address. The cost CEILING is the fail-closed assist
  // budget below (+ #591's spend ledger), not this throttle.
  if (
    await isRateLimited("ai:partner:ip", getClientIp(request.headers), {
      maxTokens: 600,
      refillIntervalMs: 60_000,
      failClosed: true,
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

  // Whether Gemini has BILLED us for this request. Flips true the instant the
  // model returns a 2xx (`response.ok`) — a non-2xx or a network throw means it
  // never ran. This gates the refund: we hand the assist back ONLY when we were
  // not billed. A successful-but-useless generation (empty, non-JSON, or
  // MAX_TOKENS truncation) is billed cost and is NOT refunded, closing the hole
  // where reliably triggering truncation bought unlimited billed calls against a
  // quota that never decremented (AIE-10/-11). The CAUSE — attacker-triggerable
  // truncation — is closed by spec item 3a (diff-propose + MAX_CODE_CHARS 8k),
  // implemented here: propose emits compact edits at a 2,048-token cap, so there
  // is no full-file echo to inflate and no deterministic MAX_TOKENS to trigger.
  let billed = false;
  try {
    // Prompt-building lives INSIDE the try on purpose: any throw here (a
    // malformed block, a builder error) is PRE-billing — `billed` is still
    // false — so the catch refunds it under `if (!billed)`. Nothing built here
    // is referenced after the try, so widening the boundary changes no other
    // semantics.

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

    // Teacher-authored common mistakes (#592) — the second half of the
    // evidenced output contract (AIE-25/-26). One bullet per note; absent leaves
    // the prefix exactly as before. The schema bounds this (max 6 × 500 chars),
    // but re-bound at the runtime money surface too: an out-of-contract bundle
    // (schema bypass / hand-edit) must never push unbounded text into the
    // platform-funded prompt. Cap the count, then each note, before formatting.
    const tutorNotes = codeBlock.tutorNotes?.length
      ? codeBlock.tutorNotes
          .slice(0, 6)
          .map((note) => `- ${note.slice(0, 500)}`)
          .join("\n")
      : undefined;

    const prefix = buildStaticPrefix({
      task,
      visibleTests,
      solution: codeBlock.solution,
      tutorNotes,
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
          responseSchema: responseSchemaFor(action),
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

    // Past this point Gemini has BILLED us (`response.ok` — a 2xx). Mark the
    // request billed so no downstream failure path refunds it, and record the
    // spend in the non-refundable billed-assists counter (best-effort, never
    // throws).
    billed = true;
    // Deliberately awaited, not `void`ed: on Vercel serverless, work not settled
    // before the response returns can be frozen/killed with the lambda, which
    // would silently drop this billing record — the durable audit of spend. The
    // one added RPC is on the paid path only (max 4/lesson). If latency ever
    // matters here, use `after()`/`waitUntil` semantics, never a bare `void`.
    await recordBilledAssist(user.id, lesson._id);

    const data = await response.json();
    // Prompt-cache observability — useful for tuning the cache-shaped prefix, but
    // this is the SUCCESS path of every paid call, so keep it opt-in (default
    // off) rather than logging on every request in production. Set
    // AI_PARTNER_DEBUG=1 to surface it. Failure-path diagnostics below stay
    // unconditional — they only fire on an actual error.
    if (process.env.AI_PARTNER_DEBUG === "1") {
      console.log(
        "[ai/partner] cachedContentTokenCount:",
        data?.usageMetadata?.cachedContentTokenCount ?? 0
      );
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) {
      // Billed but useless — usually finishReason "MAX_TOKENS" with the budget
      // spent before any visible output. NOT refunded: Gemini billed the tokens.
      // Log the reason so maxTokensFor(action) can be tuned; diff-propose +
      // MAX_CODE_CHARS 8k (item 3a, this change) is what makes this hard to hit.
      console.error("[ai/partner] empty output", { action, finishReason });
      return NextResponse.json(
        { error: "AI could not generate a response" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Billed but unusable — a truncated payload (finishReason "MAX_TOKENS")
      // cut off mid-string. NOT refunded: the tokens were billed. Log the reason
      // + a snippet so the cap can be tuned.
      console.error("[ai/partner] non-JSON output", {
        action,
        finishReason,
        snippet: rawText.slice(0, 200),
      });
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    const validated = validatePartnerResponse(parsed);
    if (!validated) {
      // Billed but structurally wrong (or truncated past the point the JSON
      // still parsed). NOT refunded — the tokens were billed.
      console.error("Gemini partner API returned a malformed payload");
      return NextResponse.json(
        { error: "AI returned an invalid response" },
        { status: 502 }
      );
    }

    let clientResponse: PartnerResponse;
    if (validated.type === "propose") {
      // Seal the answer server-side — the client only ever sees
      // {question, options} + an opaque checkToken. Never spread `validated`
      // here: that would leak `correctIndex`/`explanation` into the response.
      const checkToken = sealCheck({
        correctIndex: validated.correctIndex,
        explanation: validated.explanation,
      });
      clientResponse = {
        type: "propose",
        rationale: validated.rationale,
        edits: validated.edits,
        check: {
          question: validated.question,
          options: validated.options,
        },
        checkToken,
      };
    } else {
      clientResponse = validated;
    }

    // Persist the turn(s) to the per-(user, lesson) log so a returning learner
    // can review these AI notes without spending another assist. Runs only on
    // this success path — after every refund branch has returned — so the log
    // stays aligned with the assists actually charged. "ask" also records the
    // learner's question; propose/hint carry no user text. Best-effort:
    // appendAssistLog never throws, and logging must not block the paid reply.
    const logEntries: PartnerMessage[] = [
      ...(action === "ask" && message
        ? [{ role: "user", text: message } as const]
        : []),
      { role: "ai", response: clientResponse } as const,
    ];
    await appendAssistLog(user.id, lesson._id, logEntries);

    return NextResponse.json(clientResponse);
  } catch (error) {
    console.error("AI partner error:", error);
    // Refund ONLY if Gemini never billed us — a throw before the 200 (network
    // failure, DNS, TLS, abort). A throw AFTER `billed` (envelope parse, seal,
    // or appendAssistLog) is post-billing and must NOT refund: this catch wraps
    // appendAssistLog, so the old unconditional refund handed back a fully
    // billed success (the AIE-10 line-411 correction).
    if (!billed) {
      await refundAssist(user.id, lesson._id);
    }
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
