import { NextRequest, NextResponse } from "next/server";
import type { CodeBlockData, ProseBlockData } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { getLessonBySlug } from "@/lib/content/queries";
import {
  spendAssistTurn,
  refundAssistTurn,
  recordBilledAssist,
  appendAssistLog,
} from "@/lib/ai/assist-budget";
import {
  checkAiSpend,
  recordAiSpend,
  degradedMaxTokens,
} from "@/lib/ai/spend-ledger";
import type { GeminiUsageMetadata } from "@/lib/ai/spend-ledger";
import { sealCheck } from "@/lib/ai/check-seal";
import { modelForAction, geminiUrl } from "@/lib/ai/models";
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
import {
  isCapstoneLesson,
  CAPSTONE_AI_OFF_CODE,
} from "@/lib/credentials/capstone-identity";
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

// Conservative input-token estimate for the spend-ledger fallback (#724) when a
// billed 200 carries no usageMetadata to measure. The prompt is prefix (task +
// public tests + solution + tutor notes) + suffix (code ≤8k chars + message ≤4k
// chars); at ~4 chars/token that input tops out near this figure. Over-estimating
// here is deliberate — an unmeasurable billed call should read as more spend, not
// less. Only used when the metered estimate is zero.
const SPEND_FALLBACK_PROMPT_TOKENS = 6_000;

// The Gemini generateContent envelope, narrowed to the fields this route reads.
// Typed (not `any`) so the defensive parse below stays type-safe.
interface GeminiEnvelope {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: GeminiUsageMetadata & { cachedContentTokenCount?: number };
}

// Model selection is PER ACTION (#868) and lives in lib/ai/models — this route
// no longer pins one URL. hint → gemini-3.5-flash-lite; ask/propose/review →
// gemini-3.6-flash; any Socratic-tier hint/ask turn → flash-lite regardless of
// the base mapping.
//
// The old comment here claimed the 2.5 family was gated for new keys ("not
// available to new users"). That is STALE: the 2026-07-28 reachability curls on
// the prod key (#838 comment, AIE-04) returned HTTP 200 for 3.5-flash,
// 3.5-flash-lite and 3.6-flash, and 2.5-flash/-lite appear in this key's model
// list; the 404s that produced the folklore were a first-connection artifact
// (empty-bodied, gone on retry). Same record, AIE-05: `thinkingBudget: 0` is
// verified honored — every routed model here is a thinking model whose thinking
// tokens would draw from maxOutputTokens and bill at the output rate, so the
// flag stays on for all of them.
//
// A model that 404s FAILS CLOSED: the !response.ok branch below refunds the
// assist and 502s. There is deliberately no silent fallback to another model —
// that would bill the learner's turn against a model the ledger wasn't told
// about.

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
  const clientIp = getClientIp(request.headers);
  if (
    await isRateLimited("ai:partner:ip", clientIp, {
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

  // AI HARD-OFF ON THE CAPSTONE (#867, unified spec item 33). The capstone
  // credential attests that the learner shipped the program themselves (the
  // deploy gate, item 14) — so it certifies nothing if a tutor could have
  // written it. This is the SERVER leg, keyed off the SAME constant as that
  // gate (`lib/credentials/capstone-identity`), so the two can never drift:
  // re-shaping the capstone lesson cannot silently re-open the AI path.
  //
  // Placement is load-bearing on two counts:
  //   • BEFORE any spend — no assist turn, no ledger entry, no Gemini call. A
  //     refusal here costs the learner nothing (it is not a failure, it is the
  //     design), so it must not consume a turn.
  //   • BEFORE the `codeBlock` 404 — the capstone hosts no `code` block today,
  //     so a structural 404 is what happens by accident. This returns the
  //     TYPED reason instead, which is the whole point of the issue: the
  //     refusal must be intentional and observable, not incidental.
  // The copy is neutral, not an error: this is a permanent, explained state.
  if (lesson && isCapstoneLesson(lesson._id)) {
    return NextResponse.json(
      {
        error: "AI Partner is off for the capstone",
        code: CAPSTONE_AI_OFF_CODE,
        capstoneAiOff: true,
      },
      { status: 403 }
    );
  }

  const codeBlock = lesson?.blocks.find(
    (b): b is CodeBlockData => b._type === "code"
  );
  if (!lesson || !codeBlock) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Daily SPEND gate (#591) — the cost ceiling on the Superteam-sponsored key,
  // separate from the per-lesson assist quota below. Reads today's accumulated
  // micro-USD for this account, this IP, and the global envelope and picks a
  // tier. FAIL CLOSED: a ledger error denies (503), never serves unmetered. This
  // runs BEFORE spendAssist so a hard-cap / ledger-outage denial does not burn
  // one of the learner's paid assists.
  //
  // Bounded TOCTOU residual (#724 minor): the check reads accumulated spend, then
  // the request bills, then recordAiSpend writes — so N requests already in
  // flight when the hard cap is crossed can each still bill, overshooting by up
  // to ~N × the per-call cost (a full-budget propose ≈ $0.006). N is bounded by
  // this route's fail-closed limiters (20/min per user, 600/min per IP), so the
  // worst-case overshoot is small and self-limiting, not unbounded — an accepted
  // residual, not a hole. Tightening it would require reserving spend before the
  // call (a pre-charge/settle), which is not worth the latency at these amounts.
  const spendGate = await checkAiSpend(user.id, clientIp);
  if (spendGate.decision === "denied") {
    // Both the hard-cap and the fail-closed ledger-outage return 503 with a
    // `spendCapped` flag the client localizes; `reason` distinguishes them for
    // logs/tests without changing the learner-facing copy.
    return NextResponse.json(
      {
        error: "AI tutor daily limit reached",
        spendCapped: true,
        reason: spendGate.reason,
      },
      { status: 503 }
    );
  }
  // Over a soft cap → degrade: serve with a shorter output budget (the dominant
  // cost lever) rather than refusing. "Degrade first, then stop" (owner).
  const degraded = spendGate.decision === "degraded";

  // Every request that reaches this route is a METERED AI turn — free authored
  // hints are served client-side from the block's `hints` ladder and never hit
  // this route. Spend one assist-LADDER turn atomically before calling Gemini
  // (#864): the SECURITY DEFINER RPC resolves the tier server-side (2 free →
  // 8 metered → 20 Socratic, per (user, lesson)) and reports which tier this
  // turn landed in. A denial means the whole ladder is spent — the community
  // handoff (spec §4.2 turn 31): the client degrades to the forum link, never
  // a paywall shape. Budget is keyed by the lesson id.
  const spend = await spendAssistTurn(user.id, lesson._id);
  if (!spend.allowed) {
    return NextResponse.json({ budgetExhausted: true, counts: spend.counts });
  }
  // Socratic tier (§4.4): flip the default contract for hint/ask to ONE
  // diagnostic question (prompt suffix below) at a hint-sized output cap.
  // `propose` keeps its full diff contract at every tier — the §4.2 ruling —
  // and `review` is post-pass and unaffected.
  const socratic = spend.tier === "socratic";

  // Resolve the model for THIS turn once: the same value drives the endpoint,
  // the failure logs, and the ledger's pricing, so they can't disagree.
  const model = modelForAction(action, { socratic });

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
    const suffix = buildDynamicSuffix(
      {
        lessonSlug,
        courseSlug,
        action,
        message,
        code,
        testSummary,
      },
      { socratic }
    );

    const response = await fetch(`${geminiUrl(model)}?key=${GEMINI_API_KEY}`, {
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
          // Degrade-first (#591): past a soft spend cap, halve the output budget
          // (floored to stay usable) to cut the dominant cost before any refusal.
          // Socratic hint/ask turns run at the hint-sized cap (one diagnostic
          // question); propose keeps its full budget at every tier.
          maxOutputTokens: degraded
            ? degradedMaxTokens(maxTokensFor(action, { socratic }))
            : maxTokensFor(action, { socratic }),
          // Every routed model is a thinking model and thinking tokens share the
          // maxOutputTokens budget (and bill at the output rate); disable it so
          // the full budget goes to the structured response (and to cut
          // latency/cost). Verified honored per model — #838 AIE-05.
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: responseSchemaFor(action),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Gemini partner API error:",
        model,
        response.status,
        errorText
      );
      // A spend already happened above (spend.allowed was true to reach
      // here) but Gemini never ran — refund exactly the ladder tier the spend
      // landed in so a failed call doesn't burn one of the learner's turns.
      await refundAssistTurn(user.id, lesson._id, spend.tier);
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

    // Parse the envelope DEFENSIVELY. A 200 with a non-JSON body STILL billed us,
    // so response.json() must not throw past the spend booking below — otherwise
    // the assist is recorded but the spend is not (#724 minor). A parse failure
    // yields `undefined`, which the empty-output branch below turns into a 502.
    let data: GeminiEnvelope | undefined;
    try {
      data = (await response.json()) as GeminiEnvelope;
    } catch {
      data = undefined;
    }
    // Record the ACTUAL cost of this billed generation into the spend ledger
    // (#591) from usageMetadata — prompt + candidate + thinking tokens, thinking
    // billed at the output rate. Runs on EVERY billed path (empty / non-JSON /
    // truncated all still cost tokens). When usageMetadata is ABSENT (e.g. a
    // non-JSON 200) the ledger books a CONSERVATIVE fallback — full output budget
    // + a generous input estimate — instead of $0, so an unmeasurable-but-billed
    // call is never under-reported. Awaited for the same Vercel-freeze reason as
    // recordBilledAssist. Never throws.
    await recordAiSpend(user.id, clientIp, model, data?.usageMetadata, {
      promptTokens: SPEND_FALLBACK_PROMPT_TOKENS,
      outputTokens: maxTokensFor(action),
    });
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
      console.error("[ai/partner] empty output", {
        action,
        model,
        finishReason,
      });
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
      await refundAssistTurn(user.id, lesson._id, spend.tier);
    }
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
