# App: Block Registry, Completion-Gate Inversion, Declarative Achievements (CS-6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Every task is TDD: write the failing test first, watch it fail, write the real implementation, watch it pass, commit.

**Goal:** Move the Next.js app from the deleted `lesson.type` dispatch (`"content" | "challenge"`) to the block model (spec §7, §8, §4.10, §10.2, §15.4a). Six coupled changes: (1) an app-side block **registry** — a renderer map and a grader map keyed by `BlockType` — that `lesson-client.tsx` renders `lesson.blocks[]` through; (2) **invert the completion gate** in `/api/lessons/complete` so an unknown block or graded type fails **closed** instead of the current fail-**open** `if (answerKey.type === "challenge")`; (3) a second sealed type, `Attestation`, added to #346's `check-seal.ts`, verified by the gate for required-but-ungraded blocks; (4) **delete the answer-key machinery** and repoint the grader to read `solution`/`tests` from the public block projection; (5) **declarative achievements** — `PREDICATES satisfies Record<AwardKind, Predicate>` replacing `UNLOCK_CHECKS` and the two hardcoded course-id lists, with the two half-populated `UserState` constructions merged into one; (6) rewrite the two **quest GROQ couplings** in `getAllQuests` that both silently degrade to `0/N` under the block model.

**Architecture:** CS-1 (`@superteam-lms/content-schema`) is the single source of truth for block identity: `BlockType`, the `BLOCK_REGISTRY` metadata map (`{ graded, required }` per type), the `Award` discriminated union, `AWARD_KINDS`, and `AwardKind`. This plan builds two parallel app-side maps keyed by the *same* `BlockType` set, each guarded by `satisfies Record<..., ...>` so an unregistered type is a compile error:

- `RENDERERS: Record<BlockType, Renderer>` (client) — one React component per block type. `lesson-client.tsx` maps `lesson.blocks[]` through it, replacing the `lesson.type` switch, the 8 `lesson.type` branch sites, and the 4 redeclared `"content" | "challenge"` unions.
- `GRADERS: Record<GradedBlockType, Grader>` (server) — one deterministic grader per graded block type (`code`, `quiz`), reading `solution`/`tests`/`questions` from the same **public** projection every reader gets (post-D4, no secret to hide). This replaces `validateAgainstAnswerKey(ChallengeAnswerKey, …)` and the server-only answer-key queries.

The completion gate dispatches on these maps, not on a string literal. `PREDICATES: Record<AwardKind, Predicate>` gives achievements the same treatment: content names an `award.kind`, code implements the closed set of kinds, and one fully-populated `UserState` feeds every predicate.

**Tech Stack:** Next.js 14 (App Router, route handlers), React 18, Sanity v3 (GROQ read layer + `sanity typegen` types produced by CS-5), TypeScript 5.7 strict, vitest 4, Node `crypto` (AES-256-GCM sealing). Server graders reuse the existing isolate / Rust-Playground / build-server executors unchanged.

## Global Constraints

- **Strict TypeScript, zero `any`.** All maps are `satisfies Record<...>`; an unhandled `BlockType` or `AwardKind` is a compile error, not a runtime skip.
- **Fail closed, always.** The completion gate must deny (never grant XP or on-chain completion) for: an unknown block `_type`, a known graded type with no registered grader, a graded block whose proof is wrong or missing, a required-but-ungraded block whose attestation is missing/forged/expired, and any executor outage. The default branch of every dispatch is **deny**.
- **No LLM output ever mints XP.** `openEnded` is a reflection (spec §8, D5): the gate requires only a sealed attestation that the server *saw* a submission — never a correctness verdict. The AI reply is feedback-only.
- **Block results are transient.** The completion payload is `{ lessonId, courseId, proofs: Record<blockKey, proof> }`; block-level pass/fail is never persisted. The lesson stays the only durable progress unit, matching the on-chain bitmap and `user_progress`.
- **Answer keys are public (D4).** Post-CS-5 no block holds a secret. The grader reads `solution`/`tests` from the public projection; there is nothing to "leak", so `queries-answer-leak.test.ts` is deleted.
- **The block `_type` is the registry key (Amendment A).** A Sanity-projected block is `{ _type, _key, … }`; `_key` is the block key. `BLOCK_REGISTRY[block._type]`, `RENDERERS[block._type]`, `GRADERS[block._type]` all key on the same string.
- Conventional commits. Branch is app-code + tests only (this doc lives on a separate docs branch, PR #358). Run `pnpm --filter web test` and `pnpm --filter web typecheck` after every task.

---

## Prerequisites

This plan is **Phase 6** of the migration (spec §15.4). It cannot land until three upstream units merge; each is named here so the sequencing is explicit rather than assumed.

1. **CS-1 — `@superteam-lms/content-schema` merged** (branch `loop/feat-cs1-content-schema-09-07-2026`, SHA `8d2cc68`). This plan imports **actual exports**, verified against that branch:
   - `BlockType`, `BlockT` (the `z.infer` union), `BLOCK_REGISTRY` (`Record<BlockType, { graded; required }>`), `isGraded`, `isRequired` — from `packages/content-schema/src/blocks/index.ts`.
   - `Award`, `AwardT`, `AwardKind`, `AWARD_KINDS` — from `packages/content-schema/src/achievement.ts`.
   - `COMMUNITY_STATS`, `QUEST_TYPES`, `MAX_XP_PER_MINT` — from `packages/content-schema/src/constants.ts`.
   - Block schemas `CodeBlock`/`CodeBlockT` (`language`, `buildType`, `deployable`, `starter`, `solution`, `tests`, `hints`), `QuizBlock`/`QuizBlockT` (`questions[].{id,prompt,multiSelect,options[].{id,label,correct,feedback},explanation}`), `OpenEndedBlock`, the three widget blocks, and `TestCase`/`TestCaseT` (`{id,description,input,expectedOutput}` — **no `hidden`**).
   - `AwardKind` is exactly `"lessons-completed" | "lessons-completed-in-course" | "course-completed" | "path-completed" | "streak" | "user-number" | "community-stat" | "manual"` — 8 kinds. `COMMUNITY_STATS` is exactly `["totalThreads","totalAnswers","acceptedAnswers","totalCommunityXp"]`.
   - **Consume CS-1, do not restate it.** If any signature above has drifted at merge time, reconcile against the merged package before writing code — CS-1 is authoritative.

2. **CS-5 — Sanity schema v2 + read layer merged/paired** (plan `docs/superpowers/plans/2026-07-09-sanity-schema-v2.md`). CS-5 provides the block-shaped Sanity schema, the collapsed single `blocks[]{ … }` lesson projection, the inline `course.modules[]` shape, and the `sanity.types.ts` typegen output this plan's queries type against. **The one hard coupling:** CS-5 Task 7 *deletes* `getChallengeAnswerKey`, `getChallengeAnswerKeyById`, `answerKeyProjection`, and the `ChallengeAnswerKey` interface. Those deletions remove symbols imported by this plan's Task 3 consumers (`validate.ts`, `validate-challenge/route.ts`, `complete/route.ts`, the executor tests). **CS-5's deletion and this plan's grader rewire (Task 2 + Task 3) must ride the same PR train** or `pnpm --filter web typecheck` breaks in both directions (CS-5's plan §"Scope, sequencing" states this explicitly). Practically: land CS-5 and CS-6 together, or land CS-6 rebased on CS-5 with both diffs in one merge.

3. **#346 — AI Partner Challenge merged** (branch `feat/ai-partner-challenge-07-07-2026`). CS-6 **extends** three #346 primitives that are **not on `main`**:
   - `apps/web/src/lib/ai/check-seal.ts` — `sealCheck`/`openCheck` + `deriveKey()`. Task 4 adds a *second* sealed type here and hardens `deriveKey()`. The existing `SealedCheck` (`{ correctIndex: 0|1|2, explanation }`) is **not reusable** for a completion attestation (see Task 4).
   - `apps/web/src/lib/ai/assist-budget.ts` — the fail-closed `spend*`/`refund*` RPC wrappers, reused verbatim by the reflection endpoint (§8) that *issues* attestations.
   - `apps/web/src/lib/ai/partner-prompt.ts` + `partner-types.ts` — reused verbatim by the reflection flow.
   - **If #346 is still open at implementation time, CS-6 is blocked on it** (or must be built on top of the #346 branch). State it in the PR description; do not stub these files.

**Dependency chain:** `CS-1 (blocks + awards)  →  CS-5 (block projection + answer-key deletion)  →  #346 (check-seal / assist-budget)  →  CS-6 (this plan)`. CS-1 and #346 are independent of each other; both precede CS-6. CS-5 must be paired with CS-6 in one merge.

---

## File Structure

```
apps/web/src/
├── lib/
│   ├── grading/                                    NEW  — server grader engine (block model)
│   │   ├── types.ts                                NEW  — Grader, GradeResult, Proof union
│   │   ├── graders/
│   │   │   ├── code.ts                             NEW  — grades a code block from its public solution/tests
│   │   │   ├── quiz.ts                             NEW  — grades a quiz block (set equality on option ids)
│   │   │   └── index.ts                            NEW  — GRADERS: Record<GradedBlockType, Grader> (satisfies)
│   │   └── __tests__/
│   │       ├── code-grader.test.ts                 NEW  — wrong proof → 403; outage → 503; correct → ok
│   │       └── quiz-grader.test.ts                 NEW  — set mismatch → 403; exact set → ok; multiSelect
│   ├── ai/
│   │   ├── check-seal.ts                           MOD  — +Attestation seal; deriveKey(label) THROWS on all-unset
│   │   ├── partner-types.ts                        MOD  — +Attestation type
│   │   └── __tests__/attestation-seal.test.ts      NEW  — round-trip; replay(diff lesson/user)→false; expiry→false; forge→false
│   ├── gamification/
│   │   ├── achievements.ts                         MOD  — PREDICATES satisfies Record<AwardKind,Predicate>; ONE UserState builder; delete UNLOCK_CHECKS
│   │   └── __tests__/predicates.test.ts            NEW  — each kind; course-completed fires; unknown kind is a compile error
│   ├── helius/
│   │   └── event-handlers.ts                       MOD  — delete SOLANA_DEV_PATH_COURSES + hardcoded ids; use the merged UserState builder
│   ├── challenge/
│   │   ├── validate.ts                             MOD/DEL — folded into lib/grading/graders/code.ts (see Task 2)
│   │   └── __tests__/{executor,rust-executor,buildable-executor}.test.ts  MOD — retarget to the code grader
│   └── sanity/
│       ├── queries.ts                              MOD  — getAllQuests §15.4a rewrite; (answer-key fns already deleted by CS-5)
│       └── __tests__/getAllQuests.test.ts          NEW  — challengeLessonIds/moduleLessonMap non-degenerate on a blocks fixture
├── app/
│   ├── api/lessons/
│   │   ├── complete/route.ts                       MOD  — invert the gate (§7.2): graded loop → required-attestation loop; unknown → closed
│   │   ├── complete/__tests__/gate.test.ts         NEW  — unknown block/graded → 503; wrong proof → 403; replayed attestation → 403
│   │   └── validate-challenge/route.ts             MOD  — read the code block from the public projection; call the code grader
│   └── [locale]/(platform)/courses/[slug]/lessons/[id]/
│       ├── lesson-client.tsx                       MOD  — render lesson.blocks[] via RENDERERS; delete the lesson.type switch + 16 branch sites
│       └── blocks/                                 NEW  — one renderer component per block type
│           ├── prose-block.tsx  video-block.tsx  code-block.tsx  quiz-block.tsx
│           ├── open-ended-block.tsx  wallet-funding-block.tsx  program-explorer-block.tsx  deployed-program-card-block.tsx
│           └── index.ts                            NEW  — RENDERERS: Record<BlockType, Renderer> (satisfies)
└── components/lesson/                              (or existing challenge-interface.tsx reused by code-block.tsx)

packages/types/src/
└── course.ts                                       MOD  — Lesson becomes { id,title,slug,blocks: BlockT[] }; drop ContentLesson/ChallengeLesson union
```

Coupled type-union sites that reference `"content" | "challenge"` and are resolved or flagged in Task 5/6: `packages/types/src/course.ts:41`, `apps/web/src/components/course/curriculum-accordion.tsx:12`, `apps/web/src/lib/teacher/structure.ts:28`, `apps/web/src/components/teacher/course-structure-editor.tsx`. The last two belong to the `/teach` authoring surface that spec §15.4 Phase 8 retires; Task 6 either retargets their type reference to the shared `BlockType` or notes them for deletion with `/teach` — it does not expand scope to reimplement the authoring UI.

---

## Task 1 — Attestation seal (spec §8; item 3)

Extend #346's `check-seal.ts` with a **second** sealed payload type and harden the key derivation. Do this first: it is small, self-contained, and both the completion gate (Task 5) and the reflection endpoint (§8) depend on it.

**Why a new type, not `SealedCheck`.** Today `SealedCheck = { correctIndex: 0|1|2, explanation }` and `isValidSealedCheck` **rejects any other shape** (`check-seal.ts:36`). It seals a quiz answer, not a "the-server-saw-a-submission" attestation. Reusing it verbatim would mint one token valid for *every* `openEnded` block, *every* user, *forever* — capture one, replay it into any lesson's completion payload, skip the required block. The attestation must bind `{ lessonId, blockKey, userId, exp }` and be verified against the request.

**Files:**
- Modify: `apps/web/src/lib/ai/partner-types.ts` (add `Attestation`), `apps/web/src/lib/ai/check-seal.ts`.
- Create: `apps/web/src/lib/ai/__tests__/attestation-seal.test.ts`.

**Interfaces produced:** `sealAttestation(payload: Attestation): string`, `openAttestation(token: string, expect: { lessonId: string; blockKey: string; userId: string }): boolean`.

- [ ] **Step 1: Failing test** — `attestation-seal.test.ts` (mirror the `check-seal.test.ts` env setup: `vi.mock("server-only")`, set `AI_PARTNER_SEAL_SECRET`/`SUPABASE_SERVICE_ROLE_KEY` in `beforeEach`, `vi.resetModules()`):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const ORIG_SEAL = process.env.AI_PARTNER_SEAL_SECRET;
const ORIG_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  vi.resetModules();
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});
afterEach(() => {
  if (ORIG_SEAL === undefined) delete process.env.AI_PARTNER_SEAL_SECRET;
  else process.env.AI_PARTNER_SEAL_SECRET = ORIG_SEAL;
  if (ORIG_SRK === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIG_SRK;
});

const future = () => Date.now() + 5 * 60_000;
const expect3 = { lessonId: "lesson-accounts", blockKey: "reflect", userId: "user-1" };

describe("attestation-seal", () => {
  it("accepts a matching, unexpired attestation", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, expect3)).toBe(true);
  });

  it("REJECTS replay into a different lesson", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, { ...expect3, lessonId: "lesson-pdas" })).toBe(false);
  });

  it("REJECTS replay by a different user (the core exploit)", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, { ...expect3, userId: "attacker" })).toBe(false);
  });

  it("REJECTS a different block key", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, { ...expect3, blockKey: "other" })).toBe(false);
  });

  it("REJECTS an expired attestation", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: Date.now() - 1_000 });
    expect(openAttestation(token, expect3)).toBe(false);
  });

  it("REJECTS a tampered token", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    const buf = Buffer.from(token, "base64url");
    buf[buf.length - 1] ^= 0xff;
    expect(openAttestation(buf.toString("base64url"), expect3)).toBe(false);
  });

  it("does NOT open a SealedCheck token as an attestation (domain separation)", async () => {
    const { sealCheck, openAttestation } = await import("../check-seal");
    const checkToken = sealCheck({ correctIndex: 1, explanation: "x" });
    expect(openAttestation(checkToken, expect3)).toBe(false);
  });

  it("THROWS when no seal secret is configured (never HMACs the empty string)", async () => {
    delete process.env.AI_PARTNER_SEAL_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { sealAttestation } = await import("../check-seal");
    expect(() => sealAttestation({ ...expect3, exp: future() })).toThrow();
  });
});
```

Run `pnpm --filter web test attestation-seal` → **fails** (`sealAttestation`/`openAttestation` do not exist).

- [ ] **Step 2: Implement.** In `partner-types.ts` add:

```ts
/** Proof that the server saw a submission for a required-but-ungraded block
 *  (e.g. openEnded). Sealed into a token; NOT a correctness verdict. Bound to
 *  lesson+block+user+expiry so a captured token cannot be replayed elsewhere. */
export interface Attestation {
  lessonId: string;
  blockKey: string;
  userId: string;
  /** epoch ms; openAttestation rejects once passed. */
  exp: number;
}
```

In `check-seal.ts`: (a) refactor `deriveKey` to take a label and **throw** on all-unset — the spec's second correction, so an all-unset chain can never yield a publicly-computable `HMAC("")` key once this token gates on-chain XP:

```ts
const CHECK_LABEL = "ai-partner-check-seal-v1";          // existing SealedCheck
const ATTEST_LABEL = "ai-partner-attestation-seal-v1";   // NEW — domain-separated

function deriveKey(label: string): Buffer {
  const base =
    process.env.AI_PARTNER_SEAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) {
    // Enforce the invariant rather than assume it: an all-unset chain must never
    // HMAC the empty string (a publicly-computable, forgeable key).
    throw new Error(
      "check-seal: no seal secret (AI_PARTNER_SEAL_SECRET or SUPABASE_SERVICE_ROLE_KEY) configured"
    );
  }
  return crypto.createHmac("sha256", base).update(label).digest();
}
```

Update `sealCheck`/`openCheck` to call `deriveKey(CHECK_LABEL)`. Add the attestation pair, using the **distinct** `ATTEST_LABEL` (domain separation — a `checkToken` sealed under `CHECK_LABEL` will not decrypt under the attestation key, so the last test passes cryptographically, not just via shape validation). Call `deriveKey(ATTEST_LABEL)` **before** the try/catch in `openAttestation` so a missing-secret misconfiguration throws (500 at the route) instead of silently returning `false`:

```ts
function isValidAttestation(v: unknown): v is Attestation {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a.lessonId === "string" &&
    typeof a.blockKey === "string" &&
    typeof a.userId === "string" &&
    typeof a.exp === "number" &&
    Number.isFinite(a.exp)
  );
}

export function sealAttestation(payload: Attestation): string {
  const key = deriveKey(ATTEST_LABEL);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64url");
}

export function openAttestation(
  token: string,
  expect: { lessonId: string; blockKey: string; userId: string }
): boolean {
  const key = deriveKey(ATTEST_LABEL); // outside try: misconfig must throw, not silently deny
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) return false;
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ct = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
    const parsed: unknown = JSON.parse(pt);
    if (!isValidAttestation(parsed)) return false;
    return (
      parsed.lessonId === expect.lessonId &&
      parsed.blockKey === expect.blockKey &&
      parsed.userId === expect.userId &&
      parsed.exp > Date.now()
    );
  } catch {
    return false; // tamper, garbage, wrong key → deny
  }
}
```

- [ ] **Step 3:** `pnpm --filter web test attestation-seal check-seal` → all green (the existing `check-seal.test.ts` still passes; `deriveKey` is now label-parameterised but behaviour-identical for the configured case). `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `feat(ai): attestation seal for required-block completion; deriveKey throws on unset secret`.

---

## Task 2 — Block grader map (spec §7.2, §10.2; items 1 + 4 grader half)

Build the server grader engine keyed by graded block type, reading from the **public** projection. This replaces `validateAgainstAnswerKey(ChallengeAnswerKey, …)`: the graders now take a projected block (`CodeBlockT` / `QuizBlockT` shape from CS-1, resolved by CS-5's projection) instead of the deleted answer key.

**Files:**
- Create: `lib/grading/types.ts`, `lib/grading/graders/code.ts`, `lib/grading/graders/quiz.ts`, `lib/grading/graders/index.ts`.
- Create: `lib/grading/__tests__/code-grader.test.ts`, `lib/grading/__tests__/quiz-grader.test.ts`.

**Interfaces produced:**

```ts
// lib/grading/types.ts
export type GradeResult = { ok: true } | { ok: false; status: 403 | 503 };
// A grader is deterministic. status 403 = a genuine wrong/absent answer;
// status 503 = we could NOT judge (executor outage) → degrade CLOSED, never grant.
export type Grader<B = unknown> = (block: B, proof: unknown) => Promise<GradeResult>;

// Proof shapes carried in the completion payload, per graded block type.
export type CodeProof = { code: string };
export type QuizProof = { selections: Record<string, string[]> }; // questionId → chosen option ids
```

**Code grader** folds in the existing `validate.ts` routing (JS isolate / Rust Playground / build server), but sourced from the block's own public fields — `block.language`, `block.buildType`, `block.solution`, `block.tests` — with **no** `hidden` split (post-D4 every test is public and graded). Map today's `ChallengeVerdict` onto `GradeResult`: `validated && passed → {ok:true}`; `validated && !passed → {ok:false, status:403}`; `executor_unavailable → {ok:false, status:503}`; any unrecognised language/buildType → `{ok:false, status:503}` (the old `non_js_challenge` dead-end, still fail-closed). The executors (`runJsSubmission`, `runRustSubmission`, `runBuildableSubmission`, `isExecutorAvailable`) are reused verbatim.

**Quiz grader** is pure and deterministic — no executor, so it never returns 503. For each `question`, correctness is **set equality** of chosen option ids against `{ o.id | o.correct }` (multi-select is a set, per CS-1 `QuizBlock`). All questions must pass; a missing/mismatched selection → `{ok:false, status:403}`.

- [ ] **Step 1: Failing tests.** `quiz-grader.test.ts` (deterministic, no mocks):

```ts
import { describe, it, expect } from "vitest";
import { gradeQuiz } from "../graders/quiz";

const block = {
  _type: "quiz" as const,
  questions: [
    { id: "q1", prompt: "?", multiSelect: true,
      options: [
        { id: "a", label: "A", correct: true },
        { id: "b", label: "B", correct: true },
        { id: "c", label: "C", correct: false },
      ] },
    { id: "q2", prompt: "?", multiSelect: false,
      options: [
        { id: "x", label: "X", correct: true },
        { id: "y", label: "Y", correct: false },
      ] },
  ],
};

describe("gradeQuiz", () => {
  it("passes the exact correct set", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a", "b"], q2: ["x"] } });
    expect(r).toEqual({ ok: true });
  });
  it("403 when a multi-select set is incomplete", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a"], q2: ["x"] } });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 when a superset is chosen (extra wrong option)", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a", "b", "c"], q2: ["x"] } });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 when a question has no selection", async () => {
    const r = await gradeQuiz(block, { selections: { q1: ["a", "b"] } });
    expect(r).toEqual({ ok: false, status: 403 });
  });
  it("403 on a malformed proof", async () => {
    const r = await gradeQuiz(block, { selections: "nope" as unknown });
    expect(r).toEqual({ ok: false, status: 403 });
  });
});
```

`code-grader.test.ts` retargets the existing `executor.test.ts` fixtures onto the block shape: a correct submission → `{ok:true}`; a wrong submission → `{ok:false, status:403}`; executor unavailable (mock `isExecutorAvailable → false`) → `{ok:false, status:503}`; an unrecognised `language` → `{ok:false, status:503}` (fail closed). Reuse the isolate-executor mocking pattern already in `executor.test.ts`.

Run → both fail (graders absent).

- [ ] **Step 2: Implement** `graders/quiz.ts` (set equality), `graders/code.ts` (port `validate.ts` routing onto block fields → `GradeResult`), and the map:

```ts
// lib/grading/graders/index.ts
import "server-only";
import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";
import type { Grader } from "../types";
import { gradeCode } from "./code";
import { gradeQuiz } from "./quiz";

/** The graded block types, derived from CS-1's registry — not a hand-kept list. */
export type GradedBlockType = {
  [K in BlockType]: (typeof BLOCK_REGISTRY)[K]["graded"] extends true ? K : never;
}[BlockType];

// `satisfies` makes an unregistered graded type a COMPILE error, and a grader
// for a non-graded type equally so. This is the inversion's backbone: the gate
// asks GRADERS[type], and a missing grader is denial by construction.
export const GRADERS = {
  code: gradeCode,
  quiz: gradeQuiz,
} satisfies Record<GradedBlockType, Grader>;
```

- [ ] **Step 3:** `pnpm --filter web test grading` green. `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `feat(grading): block grader map (code, quiz) reading the public projection`.

---

## Task 3 — Delete the answer-key machinery; repoint the last consumers (spec §10.2; item 4)

CS-5 deletes `getChallengeAnswerKey` / `getChallengeAnswerKeyById` / `answerKeyProjection` / `ChallengeAnswerKey` / `queries-answer-leak.test.ts` from `queries.ts`. This task removes their remaining app-side consumers so `typecheck` passes in the same PR train.

**Files:**
- Modify: `apps/web/src/app/api/lessons/validate-challenge/route.ts` — fetch the lesson via the collapsed public projection (CS-5), pick the `code` block, call `gradeCode`. It returns UX pass/fail only (unchanged contract), now sourced from the block.
- Modify: `apps/web/src/lib/challenge/validate.ts` — either delete (its `validateAgainstAnswerKey` logic now lives in `graders/code.ts`) or reduce to a thin re-export the graders own. Prefer deletion; if any non-grader export is still referenced, migrate it.
- Modify: `apps/web/src/lib/challenge/__tests__/{executor,rust-executor,buildable-executor}.test.ts` — swap the `answerKey(…)` builders/`ChallengeAnswerKey` type for block fixtures + `gradeCode`. The routing assertions (JS→isolate, rust→Playground, buildable→build server, outage→503) carry over one-to-one onto `GradeResult`.
- Confirm: `apps/web/src/app/api/lessons/complete/route.ts` no longer imports `getChallengeAnswerKeyById` / `validateAgainstAnswerKey` (Task 5 rewrites it fully).

- [ ] **Step 1: Failing test (proves the deletion, in this repo).** Add to a small `lib/challenge/__tests__/no-answer-key.test.ts` (or fold into an existing suite): assert the module surface no longer exports the answer-key symbols — a red test until the deletion lands.

```ts
import { describe, it, expect } from "vitest";
import * as queries from "@/lib/sanity/queries";

describe("answer-key machinery is deleted (D4, spec §10.2)", () => {
  it("no getChallengeAnswerKey / getChallengeAnswerKeyById exports remain", () => {
    expect("getChallengeAnswerKey" in queries).toBe(false);
    expect("getChallengeAnswerKeyById" in queries).toBe(false);
  });
});
```

(This test passes only once CS-5's deletion is in the tree — it is the tripwire that CS-5 and CS-6 landed together.)

- [ ] **Step 2:** Repoint `validate-challenge/route.ts` and the executor tests onto `gradeCode` + the public block projection. Delete `validate.ts` (logic moved in Task 2). Remove the now-dead `ChallengeAnswerKey`/`AdminChallengeLesson` references from `packages/types` if unused after Task 6.
- [ ] **Step 3:** `pnpm --filter web test challenge grading` green; `git grep -n "getChallengeAnswerKey\|answerKeyProjection\|ChallengeAnswerKey\|validateAgainstAnswerKey" apps/web/src` returns **nothing**. `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `refactor(challenge): grade from the public block projection; delete answer-key machinery`.

---

## Task 4 — Invert the completion gate (spec §7.1–7.2; item 2)

Rewrite the gate in `/api/lessons/complete` from the fail-**open** `if (answerKey.type === "challenge")` (`route.ts:98`) to the block-model dispatch: an unknown block, an unknown graded type, a wrong proof, or a missing/forged attestation each **denies**.

**Files:**
- Modify: `apps/web/src/app/api/lessons/complete/route.ts`.
- Create: `apps/web/src/app/api/lessons/complete/__tests__/gate.test.ts`.

**Payload change.** From `{ lessonId, courseId, submittedCode? }` to `{ lessonId, courseId, proofs: Record<blockKey, unknown> }`. The route already fetches the course (for `deriveLessonIndex`); reuse it to get the lesson's `blocks[]` from the collapsed projection. `userId` comes from `supabase.auth.getUser()` (already present). Keep the existing on-chain enrollment / bitmap / `complete_lesson` machinery downstream **unchanged** — only the gate is inverted.

**The gate (spec §7.2, made rigorous).** The naive §7.2 filter (`b => BLOCK_REGISTRY[b._type]?.graded`) *skips* an unknown `_type` — which would fail **open**. So the first loop is an explicit membership check that denies unknown types:

```ts
import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";
import { GRADERS, type GradedBlockType } from "@/lib/grading/graders";
import { openAttestation } from "@/lib/ai/check-seal";

// ... after auth (userId), payload parse (lessonId, courseId, proofs), lesson fetch (lesson.blocks):

const deny = (status: 400 | 403 | 503, error: string) =>
  NextResponse.json({ error }, { status });

// 0) Unknown block type → CLOSED. A block whose _type is not in the registry
//    cannot be reasoned about, so completion is denied (not silently skipped).
for (const block of lesson.blocks) {
  if (!((block._type as string) in BLOCK_REGISTRY)) {
    return deny(503, "This lesson has an unrecognized block and cannot be completed yet");
  }
}

// 1) Graded blocks (code, quiz): a deterministic grader MUST pass.
for (const block of lesson.blocks) {
  const type = block._type as BlockType;
  if (!BLOCK_REGISTRY[type].graded) continue;
  const grader = GRADERS[type as GradedBlockType]; // graded ⇒ present, but guard anyway
  if (!grader) return deny(503, "No grader for this block type"); // unknown graded type → CLOSED
  const result = await grader(block, proofs[block._key]);
  if (!result.ok) return deny(result.status, "Block did not pass"); // 403 wrong, 503 outage
}

// 2) Required-but-UNGRADED blocks (openEnded): a sealed attestation must prove
//    the server saw a submission. The `!graded` filter is essential — a graded
//    block's proof is an answer set, NOT an attestation, so running it through
//    openAttestation would 403 every valid code/quiz completion.
for (const block of lesson.blocks) {
  const type = block._type as BlockType;
  if (!(BLOCK_REGISTRY[type].required && !BLOCK_REGISTRY[type].graded)) continue;
  const token = proofs[block._key];
  if (typeof token !== "string" ||
      !openAttestation(token, { lessonId, blockKey: block._key, userId })) {
    return deny(403, "This lesson requires a completed reflection");
  }
}
// ...fall through to the EXISTING on-chain enrollment/bitmap/complete_lesson path, unchanged.
```

Two independent fail-closed mechanisms, both tested: (a) unknown `_type` → loop 0 denies; (b) known-graded type with no grader → loop 1 denies. Unknown becomes fail-closed **by construction**.

- [ ] **Step 1: Failing tests** — `gate.test.ts`. Mock `getUser` (a fixed userId), the lesson fetch (return a `blocks[]` fixture), `GRADERS`, and `openAttestation`. Assert:
  - **unknown block `_type`** in the lesson → **503** (fail closed) — the replacement for today's fail-open.
  - a lesson with a **graded `code` block and a wrong proof** (grader → `{ok:false,status:403}`) → **403**, and **no** on-chain call fired.
  - a graded block whose type is **not in `GRADERS`** (simulate a registry type with graded:true but map miss) → **503**.
  - executor outage (grader → `{ok:false,status:503}`) → **503**.
  - an **`openEnded` block with no attestation** in `proofs` → **403**.
  - an `openEnded` block with an attestation **sealed for a different user** (Task 1 `sealAttestation` with `userId: "someone-else"`) → **403** (the replay-attack test).
  - the **happy path** (all graded proofs correct, valid attestation) → reaches the on-chain path (assert the downstream mock was invoked / no early deny).

Run → fail (route still on the old gate).

- [ ] **Step 2: Implement** the inversion. Delete the `getChallengeAnswerKeyById` import and the `answerKey.type === "challenge"` block. Parse `proofs`. Fetch `lesson.blocks` from the collapsed projection. Keep everything from the wallet lookup downward.
- [ ] **Step 3:** `pnpm --filter web test complete` green. `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `feat(lessons): invert completion gate to the block model — unknown blocks fail closed`.

---

## Task 5 — Declarative achievements (spec §4.10, D9; item 5)

Replace the closure-per-achievement `UNLOCK_CHECKS` with `PREDICATES satisfies Record<AwardKind, Predicate>` implementing CS-1's 8 award kinds; delete `SOLANA_DEV_PATH_COURSES` and the hardcoded course ids; **merge the two half-populated `UserState` constructions into one** fully-populated builder.

**The two states, today.** `event-handlers.ts:750` fills progress fields and zeroes community ones; `achievements.ts:121` (`buildCommunityUserState` base) zeroes progress fields and fills community ones. Neither can award an achievement needing both. A declarative predicate needs **one** fully-populated state.

**`perfect-score` — the open question, flagged.** `allTestsPassedFirstTry` is hardcoded `false` at both sites, so `achievement-perfect-score` is unreachable. The declarative model does not fix this by itself: it needs a real signal, and block results are **transient by design** (no per-block persistence — see the gate). Two honest options, decision required before this task ships:
- **(a) Drop it.** Remove `achievement-perfect-score` from content; the predicate set never needs a `perfect-score`-specific field. Simplest, and consistent with "block results are transient."
- **(b) Keep it** only if a durable "passed every graded block first try, no prior attempt" signal is added (a counter in `user_progress` or a dedicated table), which is a Supabase change **out of CS-6 scope**. Until that exists, `allTestsPassedFirstTry` stays `false` and the achievement stays unreachable — so shipping (b) without the signal is shipping a dead achievement.
- **Plan recommendation:** ship **(a)** now; record (b) as a follow-up. The `Predicate` for a hypothetical `perfect-score` is not one of CS-1's 8 `AwardKind`s anyway — `perfect-score` would map to a `lessons-completed`-like kind plus the missing signal, so it is not blocked on the predicate map, only on the signal. Do **not** invent an `AwardKind` for it.

**Files:**
- Modify: `apps/web/src/lib/gamification/achievements.ts` — add `PREDICATES`, the merged `UserState` + one builder, delete `UNLOCK_CHECKS`; keep/rework `checkNewAchievements` to read each deployed achievement's `award.kind` and evaluate `PREDICATES[kind]`.
- Modify: `apps/web/src/lib/helius/event-handlers.ts` — delete `SOLANA_DEV_PATH_COURSES` + the `course-rust-for-solana`/`course-anchor-framework` literals; call the shared builder.
- Create: `apps/web/src/lib/gamification/__tests__/predicates.test.ts`.

**Interfaces produced:**

```ts
// One fully-populated state — progress AND community AND path completion.
export interface UserState {
  completedLessons: number;
  completedLessonsByCourse: Record<string, number>;   // for lessons-completed-in-course
  completedCourseIds: ReadonlySet<string>;             // for course-completed
  completedPathIds: ReadonlySet<string>;               // for path-completed (real paths, not hardcoded)
  currentStreak: number;
  userNumber: number;
  community: Record<(typeof COMMUNITY_STATS)[number], number>; // totalThreads/... from community_stats
}

type Predicate = (award: AwardT, s: UserState) => boolean;

// A kind with no predicate is a COMPILE error (spec gate 12). `award` is the
// CS-1 discriminated union, so each branch narrows on `award.kind`.
export const PREDICATES = {
  "lessons-completed": (a, s) => a.kind === "lessons-completed" && s.completedLessons >= a.gte,
  "lessons-completed-in-course": (a, s) =>
    a.kind === "lessons-completed-in-course" && (s.completedLessonsByCourse[a.course] ?? 0) >= a.gte,
  "course-completed": (a, s) => a.kind === "course-completed" && s.completedCourseIds.has(a.course),
  "path-completed": (a, s) => a.kind === "path-completed" && s.completedPathIds.has(a.path),
  "streak": (a, s) => a.kind === "streak" && s.currentStreak >= a.days,
  "user-number": (a, s) => a.kind === "user-number" && s.userNumber <= a.lte,
  "community-stat": (a, s) => a.kind === "community-stat" && (s.community[a.stat] ?? 0) >= a.gte,
  "manual": () => false, // admin-granted only (bug-hunter); never auto-fires
} satisfies Record<AwardKind, Predicate>;
```

`hasCompletedAllTracks` / `SOLANA_DEV_PATH_COURSES` disappear: `full-stack-solana` becomes `award: { kind: "path-completed", path: "path-solana-core" }` (content, CS-1/CS-5), and `completedPathIds` is computed from the real `learningPath` → course membership (a path is complete when every course it references is in `completedCourseIds`). `hasCompletedRustLesson`/`hasCompletedAnchorCourse` become `lessons-completed-in-course` / `course-completed` awards. **No course id is hardcoded in TypeScript.**

- [ ] **Step 1: Failing tests** — `predicates.test.ts`:
  - **`course-completed` fires** when the award's `course` is in `completedCourseIds`, and does not when absent.
  - `lessons-completed` boundary (`gte`), `lessons-completed-in-course` reads the per-course map, `streak`/`user-number`/`community-stat` boundaries.
  - `path-completed` fires only when the referenced path's courses are all completed.
  - `manual` never fires from state.
  - a compile-time assertion (a `const _c: Record<AwardKind, Predicate> = PREDICATES`) proving every kind is covered — remove a key and `typecheck` fails.
  - `checkNewAchievements` awards exactly the deployed achievements whose `award` predicate is satisfied and not already unlocked.

Run → fail.

- [ ] **Step 2: Implement.** Rewrite `achievements.ts`; write **one** `buildUserState(admin, userId)` that populates progress + community + path fields in a single pass (folding in what `event-handlers.ts` computed and what `buildCommunityUserState` computed). Update `event-handlers.ts` to call it and delete the hardcoded lists. `checkNewAchievements(deployed, state, alreadyUnlocked)` now reads `def.award.kind` and evaluates `PREDICATES[def.award.kind](def.award, state)`. Deployed achievements must carry `award` — extend the `DeployedAchievement`/Sanity projection (CS-5) to include it; a `manual` award simply never auto-fires.
- [ ] **Step 3:** `pnpm --filter web test predicates gamification` green; `git grep -n "SOLANA_DEV_PATH_COURSES\|UNLOCK_CHECKS\|hasCompletedAllTracks" apps/web/src` returns nothing. `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `feat(gamification): declarative achievement predicates; merge UserState; drop hardcoded course ids`.

---

## Task 6 — Block renderer map + `lesson-client.tsx` migration (spec §7.3; item 1 renderer half)

Replace the `lesson.type` switch, the 8 `lesson.type` branch sites, and the 4 redeclared `"content" | "challenge"` unions with a renderer map.

**Files:**
- Create: `.../lessons/[id]/blocks/{prose,video,code,quiz,open-ended,wallet-funding,program-explorer,deployed-program-card}-block.tsx` + `blocks/index.ts`.
- Modify: `.../lessons/[id]/lesson-client.tsx`.
- Modify: `packages/types/src/course.ts` — `Lesson` becomes `{ id; title; slug; blocks: BlockT[] }` (import `BlockT` from CS-1 or use CS-5's `sanity.types.ts`); delete `ContentLesson`/`ChallengeLesson`.
- Modify/flag: `curriculum-accordion.tsx:12`, and the `/teach` sites (`teacher/structure.ts:28`, `course-structure-editor.tsx`) — retarget the union to `BlockType` or note for Phase-8 deletion with `/teach`.

**Interface produced:**

```ts
// blocks/index.ts
import type { BlockType } from "@superteam-lms/content-schema";
import { ProseBlock } from "./prose-block";
// ...one import per block type...

export type Renderer = (props: { block: unknown; lesson: LessonContext }) => JSX.Element | null;

// A missing renderer is a COMPILE error — the render-side mirror of the grader map.
// (Amendment A: a widget that renders nothing cannot exist — the type must have a member.)
export const RENDERERS = {
  prose: ProseBlock,
  video: VideoBlock,
  code: CodeBlock,                       // wraps the existing ChallengeInterface, wired to submit a CodeProof
  quiz: QuizBlock,                       // collects QuizProof
  openEnded: OpenEndedBlock,             // #346 reflection UI; on submit obtains the attestation token
  "wallet-funding": WalletFundingBlock,
  "program-explorer": ProgramExplorerBlock,
  "deployed-program-card": DeployedProgramCardBlock,
} satisfies Record<BlockType, Renderer>;
```

`lesson-client.tsx` renders `lesson.blocks.map((b) => { const R = RENDERERS[b._type]; return <R key={b._key} block={b} lesson={ctx} />; })`. The existing `ReactMarkdown` path moves into `prose-block.tsx`; `getEmbedUrl` into `video-block.tsx`; `ChallengeInterface` is wrapped by `code-block.tsx`. Each block collects its own proof and contributes to the `proofs` object the "complete" button submits to the inverted gate (Task 4). `openEnded` submits its reflection to the §8 endpoint, which returns the sealed attestation token that becomes `proofs[blockKey]`.

- [ ] **Step 1: Failing test** — a component/registry test: `RENDERERS` has an entry for **every** `BlockType` (`BLOCK_TYPES.every((t) => t in RENDERERS)`), and rendering a small blocks-shaped lesson fixture through `lesson-client` mounts one node per block (assert prose renders its markdown, a code block mounts the challenge interface). Use the existing web test setup (Testing Library if present; otherwise a pure registry-coverage test + a `satisfies` compile check).

Run → fail.

- [ ] **Step 2: Implement** the eight renderers + map, rewrite `lesson-client.tsx` to the `blocks[]` loop, reshape `packages/types` `Lesson`, retarget/flag the union sites.
- [ ] **Step 3:** `pnpm --filter web test lesson` green; `git grep -n "lesson.type" apps/web/src` returns nothing (or only the flagged `/teach` sites explicitly slated for Phase-8 deletion). `pnpm --filter web typecheck`.
- [ ] **Step 4: Commit** — `feat(lesson): render blocks[] via a renderer registry; delete the lesson.type switch`.

---

## Task 7 — Quest GROQ couplings in `getAllQuests` (spec §15.4a; item 6)

`getAllQuests` (`queries.ts`) feeds `get_daily_quest_state` two inputs that both break **silently** under the block model — each degrades to `[]` and its quest renders `0/N` forever (the silent-degradation shape §6.3 warns about).

**Files:**
- Modify: `apps/web/src/lib/sanity/queries.ts` (`getAllQuests`).
- Create: `apps/web/src/lib/sanity/__tests__/getAllQuests.test.ts`.

**The two rewrites:**
- `challengeLessonIds: *[_type=="lesson" && type=="challenge"]._id` — `lesson.type` is deleted (D2). Rewrite to graded-block presence:
  `*[_type=="lesson" && count(blocks[_type=="code"]) > 0]._id`.
- `moduleLessonMap: *[_type=="module"]{ "_id": _id, "lessonIds": lessons[]->_id }` — `module` documents are deleted (CS-5, §10.1; now inline objects on the course). Rebuild from inline `course.modules[]`:
  `*[_type=="course"]{ "modules": modules[]{ "id": key, "lessonIds": lessons[]->_id } }` then flatten to the same `Array<{ id; lessonIds: string[] }>` shape the SQL consumer expects (module `id` is now the inline `key`, unique within a course; namespace with the course id if the SQL needs global uniqueness).

Keep the existing `.filter(Boolean)` null-guards (weak refs may dangle to `null` post-CS-5, §9.5). `lesson`/`lesson_batch` remain the same predicate (aliases per §15.4a).

- [ ] **Step 1: Failing test** — `getAllQuests.test.ts`. Mock `sanityFetch` to return a **blocks-shaped** fixture (a lesson with a `code` block; a course with inline `modules[]`). Assert:
  - `challengeLessonIds` is **non-empty** and contains the code-block lesson's id (proves the new predicate matches blocks, not the deleted `type`).
  - a lesson with only `prose`/`quiz`... wait — quiz is graded too, but §15.4a specifies `code` presence for the challenge-quest predicate; assert a prose-only lesson is **excluded**.
  - `moduleLessonMap` is **non-empty**, rebuilt from inline modules, with the right `lessonIds`.
  - dangling (`null`) lesson refs are filtered out.

Run → fail (current GROQ queries the deleted `type`/`module`).

- [ ] **Step 2: Implement** the two GROQ rewrites + the flatten. Verify the returned `QuestData` shape is byte-compatible with the `get_daily_quest_state` consumer.
- [ ] **Step 3 (spec §15.4a Phase-6 verification):** with the migrated dataset, assert **each of the 5 live quests** has non-degenerate inputs — `challengeLessonIds` non-empty **and** `moduleLessonMap` non-empty — before declaring the task done. A silent `0/N` is invisible in a happy-path unit test; this is the explicit guard the spec mandates. Capture it as an integration check (against the synced dataset) or a documented manual verification step in the PR.
- [ ] **Step 4: Commit** — `fix(quests): rewrite getAllQuests couplings for the block model (§15.4a)`.

---

## Verification (whole plan)

Run from the repo root; **all must be green** before CS-6 is done:

- [ ] `pnpm --filter web test` — the full web suite, including every new suite: `attestation-seal`, `grading` (code + quiz), `predicates`, the inverted-gate `gate.test.ts`, `getAllQuests`, and the retargeted challenge-executor tests.
- [ ] `pnpm --filter web typecheck` (`tsc --noEmit`) — proves the three `satisfies Record<...>` maps (`GRADERS`, `RENDERERS`, `PREDICATES`) cover their full key sets; a missing block type or award kind is a compile error, not a silent runtime skip.
- [ ] **Fail-closed proof (item 2):** the gate test shows an **unknown block `_type` → 503** and an **unknown graded type → 503** — the inversion of today's fail-open `if (answerKey.type === "challenge")`. A graded block with a **wrong proof → 403** with no on-chain call.
- [ ] **Replay proof (item 3):** the attestation test shows a token sealed for one `{lessonId, blockKey, userId}` is **rejected** when replayed into a different lesson, a different user, or after expiry; the gate test shows a wrong-user attestation → **403**.
- [ ] **Deletion proof (item 4):** `git grep -n "getChallengeAnswerKey\|answerKeyProjection\|ChallengeAnswerKey\|validateAgainstAnswerKey\|UNLOCK_CHECKS\|SOLANA_DEV_PATH_COURSES\|lesson.type" apps/web/src` returns nothing (modulo flagged `/teach` sites slated for Phase-8 deletion).
- [ ] **Quest proof (item 6):** `getAllQuests` returns non-empty `challengeLessonIds` and `moduleLessonMap` against a blocks-shaped fixture, and all 5 live quests are non-degenerate post-migration (Task 7 Step 3).

**Six-item coverage:** (1) block registry → Tasks 2 (grader map) + 6 (renderer map); (2) gate inversion → Task 4; (3) attestation seal → Task 1; (4) answer-key deletion + grader rewire → Tasks 2 + 3; (5) declarative achievements → Task 5; (6) quest GROQ couplings → Task 7.

## Out of scope / follow-ups

- The §8 reflection **endpoint** that *issues* attestations (reusing #346's `assist-budget`/`partner-prompt`) is the natural sibling of Task 1's seal but is scoped with the `openEnded` feature work, not this gate/registry plan. Task 1 provides the seal it will call; Task 6's `open-ended-block.tsx` provides the UI.
- `achievement-perfect-score` durable "first-try" signal (Task 5 option (b)) — a Supabase change, deferred; ship option (a) now.
- The `/teach` authoring UI union sites (Task 6 flagged) retire in spec §15.4 Phase 8.
- Moving the five client-side Sanity fetch sites server-side (spec §10.3) — tracked separately.
