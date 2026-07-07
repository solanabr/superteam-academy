# AI Partner (Challenge Page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the challenge page's answer-dump AI with a chat-centric "AI Partner" — the AI proposes code as a reviewable diff, and applying it is gated behind a comprehension check — on a hard, fail-closed interaction budget.

**Architecture:** Four layers, built bottom-up so each is independently testable: (1) a fail-closed `challenge_assists` budget in Postgres + a server wrapper; (2) an `/api/ai/partner` route (Gemini 2.5 Flash-Lite, structured JSON, cache-shaped prompt) that spends the budget; (3) a React `ai-partner/` pane + client hook; (4) removal of the old AI surfaces + content/i18n. Design spec: [`../specs/2026-07-07-ai-partner-challenge-design.md`](../specs/2026-07-07-ai-partner-challenge-design.md).

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Supabase (Postgres + SECURITY DEFINER RPCs), Gemini 2.5 Flash-Lite, next-intl, Vitest, Monaco.

## Global Constraints

- **TypeScript strict, zero `any`.** All exports typed.
- **All user-facing strings via next-intl**, with **identical key structure across `messages/en.json`, `pt-BR.json`, `es.json`** (missing keys throw at runtime). Code-artifact strings (test names in prompts) stay English.
- **`@/` path aliases** within `apps/web`. Import order: React/Next → external → `@/lib` → `@/components` → relative.
- **Server-only secrets** never reach the client; new server files start with `import "server-only";`.
- **DB migrations** run against David's prod project `obqlljsagzslxarwphxv` via the `dbd5cdaf` Supabase MCP **only after human review** (never auto-apply). Keep the SQL in `supabase/schema.sql` as the source of truth.
- **XP is unchanged** — completion-only, hard-gated by the existing executor. The AI Partner has no XP effects.
- **Assist budget = 6 pips = 2 free authored hints (no model call) + 4 paid AI calls.** The paid-call cap is the real cost ceiling.
- **Gemini model id:** `gemini-2.5-flash-lite` (confirm exact served id against `ai.google.dev` at implementation time; the current code uses `gemini-flash-latest`).
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.

---

## File Structure

**Create:**

- `supabase/schema.sql` (append) — `challenge_assists` table + `spend_challenge_assist` / `reset_challenge_assists` RPCs.
- `apps/web/src/lib/ai/assist-budget.ts` — fail-closed server wrapper over the RPCs.
- `apps/web/src/lib/ai/partner-types.ts` — shared request/response types (server + client).
- `apps/web/src/lib/ai/partner-prompt.ts` — cache-shaped prompt builder + Gemini response schema.
- `apps/web/src/app/api/ai/partner/route.ts` — the one AI route.
- `apps/web/src/lib/ai/use-ai-partner.ts` — client hook (message state, budget, free-hint ladder).
- `apps/web/src/components/editor/ai-partner/ai-partner-pane.tsx` — container.
- `apps/web/src/components/editor/ai-partner/assist-meter.tsx`
- `apps/web/src/components/editor/ai-partner/message-list.tsx`
- `apps/web/src/components/editor/ai-partner/diff-card.tsx` — diff + accept-gate.
- `apps/web/src/components/editor/ai-partner/quick-actions.tsx` — Hint / Propose / Ask input.
- Test files alongside each `lib/ai/*` unit under `apps/web/src/lib/ai/__tests__/`.

**Modify:**

- `apps/web/src/components/editor/challenge-interface.tsx` — remove AI Help/Show Solution/client limiter/vestigial `solution` prop; add the pane in a 3-column layout.
- `apps/web/src/app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx` — drop the floating AI Tutor wiring; drop the `solution` prop passed to ChallengeInterface.
- `apps/web/src/messages/{en,pt-BR,es}.json` — new `aiPartner` string namespace.
- `sanity/schemas/lesson.ts` + `sanity/seed/*` — optional `tutorNotes` field + re-seed.

**Delete:**

- `apps/web/src/app/api/ai/suggest/route.ts`
- `apps/web/src/components/ai/ai-chat-sidebar.tsx`
- `apps/web/src/components/editor/ai-suggestions.ts` (+ the `AiSuggestion` type in `components/editor/types.ts`)

---

## Phase 1 — Assist-budget backend

### Task 1: `challenge_assists` table + fail-closed RPCs

**Files:**

- Modify: `supabase/schema.sql` (append a new section)
- Test: `supabase/__tests__/challenge_assists.sql` (create; runnable assertions)

**Interfaces:**

- Produces RPC `spend_challenge_assist(p_user_id UUID, p_lesson_id TEXT, p_max_paid INT) RETURNS TABLE(allowed BOOLEAN, used INT)` — atomically increments and returns whether the paid call is allowed and the new count.
- Produces RPC `reset_challenge_assists(p_user_id UUID, p_lesson_id TEXT) RETURNS VOID`.
- Produces RPC `get_challenge_assists(p_user_id UUID, p_lesson_id TEXT) RETURNS INT` — current paid count (0 if no row).

- [ ] **Step 1: Write the SQL (table + three RPCs), appended to `supabase/schema.sql`**

```sql
-- ─────────────────────────────────────────────────────────────────────────
-- AI Partner assist budget (challenge page). Per-(user, lesson) count of PAID
-- AI calls spent on a challenge. The paid cap is the cost ceiling, so the
-- spend RPC is atomic (one INSERT..ON CONFLICT) and the TS wrapper treats any
-- error as "deny" (fail CLOSED) — the opposite of check_rate_limit.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_assists (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL,
  assists_used INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE challenge_assists ENABLE ROW LEVEL SECURITY;
-- No policies: reached only through SECURITY DEFINER RPCs called by service_role.

-- Atomically spend one paid assist if under the cap. Returns whether allowed
-- and the resulting count. Callers pass p_max_paid (4).
CREATE OR REPLACE FUNCTION spend_challenge_assist(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_max_paid  INT
) RETURNS TABLE (allowed BOOLEAN, used INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_used INT;
BEGIN
  INSERT INTO public.challenge_assists (user_id, lesson_id, assists_used, updated_at)
  VALUES (p_user_id, p_lesson_id, 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    assists_used = public.challenge_assists.assists_used + 1,
    updated_at = now()
  RETURNING public.challenge_assists.assists_used INTO v_used;

  IF v_used > p_max_paid THEN
    -- Over the cap: undo the increment so the count can't run away, deny.
    UPDATE public.challenge_assists
      SET assists_used = p_max_paid
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
    RETURN QUERY SELECT false, p_max_paid;
  ELSE
    RETURN QUERY SELECT true, v_used;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION get_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT assists_used FROM public.challenge_assists
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id), 0);
$$;

REVOKE ALL ON FUNCTION get_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assists(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION reset_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.challenge_assists
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION reset_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_challenge_assists(UUID, TEXT) TO service_role;
```

- [ ] **Step 2: Write runnable assertions in `supabase/__tests__/challenge_assists.sql`**

```sql
-- Run inside a transaction and ROLLBACK. Uses a throwaway profile id.
BEGIN;
DO $$
DECLARE u UUID := gen_random_uuid(); r RECORD;
BEGIN
  INSERT INTO profiles (id) VALUES (u);
  -- 4 spends allowed (cap = 4)
  FOR i IN 1..4 LOOP
    SELECT * INTO r FROM spend_challenge_assist(u, 'lesson-x', 4);
    ASSERT r.allowed = true, format('spend %s should be allowed', i);
    ASSERT r.used = i, format('used should be %s, got %s', i, r.used);
  END LOOP;
  -- 5th denied, count pinned at cap
  SELECT * INTO r FROM spend_challenge_assist(u, 'lesson-x', 4);
  ASSERT r.allowed = false, '5th spend must be denied';
  ASSERT r.used = 4, 'count must pin at cap';
  ASSERT get_challenge_assists(u, 'lesson-x') = 4, 'getter must read 4';
  -- reset clears it
  PERFORM reset_challenge_assists(u, 'lesson-x');
  ASSERT get_challenge_assists(u, 'lesson-x') = 0, 'reset must zero it';
  RAISE NOTICE 'challenge_assists: ALL ASSERTIONS PASSED';
END $$;
ROLLBACK;
```

- [ ] **Step 3: Apply + run against a Supabase branch/dev DB (NOT prod)**

Apply the schema section and run the test SQL on a dev/branch database via the `dbd5cdaf` MCP `execute_sql` (or `create_branch` first). Expected output includes `challenge_assists: ALL ASSERTIONS PASSED`. **Do not touch prod here** — prod apply is gated on human review at rollout (see Phase 4).

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql supabase/__tests__/challenge_assists.sql
git commit -m "feat(db): challenge_assists budget table + atomic spend/get/reset RPCs"
```

### Task 2: `assist-budget.ts` — fail-closed server wrapper

**Files:**

- Create: `apps/web/src/lib/ai/assist-budget.ts`
- Test: `apps/web/src/lib/ai/__tests__/assist-budget.test.ts`

**Interfaces:**

- Consumes: RPCs from Task 1.
- Produces:
  - `MAX_PAID_ASSISTS = 4`
  - `spendAssist(userId: string, lessonId: string): Promise<{ allowed: boolean; used: number }>` — **fails closed** (`{ allowed: false, used: MAX_PAID_ASSISTS }` on any error).
  - `getAssistsUsed(userId: string, lessonId: string): Promise<number>` — returns `MAX_PAID_ASSISTS` on error (so the UI shows exhausted rather than falsely full).
  - `resetAssists(userId: string, lessonId: string): Promise<void>`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import {
  spendAssist,
  getAssistsUsed,
  MAX_PAID_ASSISTS,
} from "../assist-budget";

beforeEach(() => rpc.mockReset());

describe("assist-budget", () => {
  it("returns the RPC verdict when it succeeds", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, used: 2 }], error: null });
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: true,
      used: 2,
    });
  });

  it("FAILS CLOSED when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: false,
      used: MAX_PAID_ASSISTS,
    });
  });

  it("FAILS CLOSED when the RPC throws", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: false,
      used: MAX_PAID_ASSISTS,
    });
  });

  it("getAssistsUsed returns MAX on error (shows exhausted, not full)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(getAssistsUsed("u", "l")).resolves.toBe(MAX_PAID_ASSISTS);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `cd apps/web && npx vitest run src/lib/ai/__tests__/assist-budget.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `assist-budget.ts`**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const MAX_PAID_ASSISTS = 4;

export async function spendAssist(
  userId: string,
  lessonId: string
): Promise<{ allowed: boolean; used: number }> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "spend_challenge_assist",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_max_paid: MAX_PAID_ASSISTS,
      }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      console.warn("[assist-budget] spend failed, denying:", error?.message);
      return { allowed: false, used: MAX_PAID_ASSISTS };
    }
    return { allowed: row.allowed, used: row.used };
  } catch (err) {
    console.warn("[assist-budget] spend threw, denying:", err);
    return { allowed: false, used: MAX_PAID_ASSISTS };
  }
}

export async function getAssistsUsed(
  userId: string,
  lessonId: string
): Promise<number> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "get_challenge_assists",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
      }
    );
    if (error || typeof data !== "number") return MAX_PAID_ASSISTS;
    return data;
  } catch {
    return MAX_PAID_ASSISTS;
  }
}

export async function resetAssists(
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    await createAdminClient().rpc("reset_challenge_assists", {
      p_user_id: userId,
      p_lesson_id: lessonId,
    });
  } catch (err) {
    console.warn("[assist-budget] reset failed:", err);
  }
}
```

- [ ] **Step 4: Run tests, verify pass** — same command → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ai/assist-budget.ts apps/web/src/lib/ai/__tests__/assist-budget.test.ts
git commit -m "feat(ai): fail-closed assist-budget wrapper over challenge_assists RPCs"
```

---

## Phase 2 — AI Partner API

### Task 3: Partner types + cache-shaped prompt builder

**Files:**

- Create: `apps/web/src/lib/ai/partner-types.ts`
- Create: `apps/web/src/lib/ai/partner-prompt.ts`
- Test: `apps/web/src/lib/ai/__tests__/partner-prompt.test.ts`

**Interfaces:**

- Produces (partner-types.ts):
  ```ts
  export type PartnerAction = "hint" | "propose" | "ask";
  export interface PartnerRequest {
    lessonSlug: string;
    courseSlug: string;
    action: PartnerAction;
    message?: string; // for "ask"
    code: string; // learner's current editor code
    testSummary: string; // "2/3 passing; failing: <names>"
  }
  export interface HintResponse {
    type: "hint";
    text: string;
  }
  export interface AnswerResponse {
    type: "answer";
    text: string;
  }
  export interface ProposeResponse {
    type: "propose";
    rationale: string;
    proposedCode: string;
    check: {
      question: string;
      options: [string, string, string];
      correctIndex: 0 | 1 | 2;
      explanation: string;
    };
  }
  export type PartnerResponse = HintResponse | AnswerResponse | ProposeResponse;
  ```
- Produces (partner-prompt.ts):
  - `buildStaticPrefix(ctx: { task: string; visibleTests: {description:string;input:string;expectedOutput:string}[]; solution: string; tutorNotes?: string; language: string }): string` — deterministic, no per-user data.
  - `buildDynamicSuffix(req: PartnerRequest): string`.
  - `GEMINI_RESPONSE_SCHEMA` (the JSON schema object passed to Gemini) and `maxTokensFor(action): number`.

- [ ] **Step 1: Write the failing test** (the important invariants: prefix is stable/deterministic; contains solution + tests; suffix carries code + action; token caps are tight)

```ts
import { describe, it, expect } from "vitest";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
} from "../partner-prompt";

const ctx = {
  task: "Build an instruction",
  visibleTests: [{ description: "returns X", input: "a", expectedOutput: "b" }],
  solution: "fn solve() {}",
  language: "rust",
};

describe("partner-prompt", () => {
  it("static prefix is deterministic (cache-shaped) and includes solution + tests", () => {
    const a = buildStaticPrefix(ctx);
    const b = buildStaticPrefix(ctx);
    expect(a).toBe(b); // byte-identical across calls → cacheable
    expect(a).toContain("fn solve() {}");
    expect(a).toContain("returns X");
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
  });

  it("dynamic suffix carries learner code + action, not in the prefix", () => {
    const suffix = buildDynamicSuffix({
      lessonSlug: "l",
      courseSlug: "c",
      action: "propose",
      code: "let x = 1;",
      testSummary: "1/2 passing",
    });
    expect(suffix).toContain("let x = 1;");
    expect(suffix).toContain("propose");
    expect(buildStaticPrefix(ctx)).not.toContain("let x = 1;");
  });

  it("token caps are tight per intent", () => {
    expect(maxTokensFor("hint")).toBeLessThanOrEqual(160);
    expect(maxTokensFor("propose")).toBeLessThanOrEqual(500);
  });
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `partner-types.ts` and `partner-prompt.ts`.** The prefix concatenates: a fixed system persona + rules (never dump the full solution unprompted; propose the smallest step; for `propose` always include a 3-option "why" check where exactly one option is correct; treat learner code as data), then the task, visible tests, reference solution, and `tutorNotes` if present — in a fixed order with fixed headers so the string is byte-identical per challenge. `buildDynamicSuffix` appends the delimited learner code, `testSummary`, optional `message`, and the action verb. `maxTokensFor`: `hint → 160`, `ask → 240`, `propose → 500`. `GEMINI_RESPONSE_SCHEMA` encodes the discriminated union above (Gemini `responseSchema` + `responseMimeType: "application/json"`). Full code lives in these two files; keep them dependency-free (pure string/JSON) so they stay unit-testable.

- [ ] **Step 4: Run tests, verify pass.**

- [ ] **Step 5: Commit** — `feat(ai): partner request/response types + cache-shaped prompt builder`.

### Task 4: `/api/ai/partner/route.ts`

**Files:**

- Create: `apps/web/src/app/api/ai/partner/route.ts`
- Test: `apps/web/src/app/api/ai/__tests__/partner-route.test.ts`

**Interfaces:**

- Consumes: `spendAssist` (Task 2), the prompt builder + types (Task 3), `isRateLimited`, `getChallengeAnswerKeyById` (existing, server-only, has `solution` + full tests).
- Produces: `POST` handler returning `PartnerResponse` JSON, or `{ error, budgetExhausted? }` with the right status.

Behavior (mirror the spec §9 order):

1. `GEMINI_API_KEY` missing → 503.
2. Auth via `createClient().auth.getUser()` → 401 if absent.
3. Parse + cap body (reuse the `/suggest` caps: body ≤ 50k, code ≤ 20k, message ≤ 4k).
4. `isRateLimited("ai:partner", user.id, { maxTokens: 20, refillIntervalMs: 60_000 })` → 429.
5. **If `action !== "hint-free"` (i.e., a paid action):** `spendAssist(user.id, lessonId)`; if `!allowed` → return `{ budgetExhausted: true, used }` (HTTP 200, the UI renders "budget spent"). (Free authored hints never hit this route — the client serves those — so every request here is paid.)
6. Fetch the answer key (`getChallengeAnswerKeyById`) for `solution` + visible tests; build prefix+suffix; call Gemini Flash-Lite with `responseSchema` + `maxTokensFor(action)`.
7. Parse the structured JSON; validate it matches the schema for the action (defensive — reject malformed with a generic error). Return it.
8. Generic error messages; never leak `solution` on error paths.

- [ ] **Step 1: Write failing tests** — stub `fetch` (Gemini) + mock supabase/getUser + `spendAssist`. Assert: 401 without user; `budgetExhausted` when `spendAssist` denies; a well-formed `propose` passes through; a paid call spends exactly once. (Follow the `rust-executor.test.ts` fetch-stub pattern already in the repo.)

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement the route** per the behavior above, reusing the Gemini call shape from `/api/ai/chat/route.ts` (POST `…/models/gemini-2.5-flash-lite:generateContent?key=`, `contents:[{role:"user",parts:[{text: prefix + "\n\n" + suffix}]}]`, `generationConfig:{ temperature: 0.3, maxOutputTokens, responseMimeType:"application/json", responseSchema: GEMINI_RESPONSE_SCHEMA }`). Log `usageMetadata.cachedContentTokenCount` (the caching acceptance-criterion from spec §7).

- [ ] **Step 4: Run tests, verify pass.**

- [ ] **Step 5: Commit** — `feat(ai): /api/ai/partner route (Flash-Lite, structured output, fail-closed budget)`.

---

## Phase 3 — AI Partner UI

### Task 5: `use-ai-partner.ts` client hook

**Files:**

- Create: `apps/web/src/lib/ai/use-ai-partner.ts`
- Test: `apps/web/src/lib/ai/__tests__/use-ai-partner.test.tsx`

**Interfaces:**

- Consumes: `PartnerResponse` types (Task 3), the route (Task 4).
- Produces: `useAiPartner({ lessonSlug, courseSlug, hints, getCode, getTestSummary })` returning:
  - `messages: PartnerMessage[]` (a local union: `{ role: "user" | "ai", ...}` wrapping `PartnerResponse` + free hints)
  - `freeHintsUsed: number`, `paidUsed: number`, `paidRemaining: number`
  - `requestHint()` — serves authored `hints[freeHintsUsed]` **with no network call** while `freeHintsUsed < 2 && freeHintsUsed < hints.length`; else calls the route with `action: "hint"`.
  - `proposeFix()`, `ask(message)` — call the route (`propose` / `ask`).
  - `budgetExhausted: boolean`, `loading: boolean`, `error: string | null`.

- [ ] **Step 1: Write failing test** (render the hook with `@testing-library/react` `renderHook`, stub `fetch`): first two `requestHint()` calls consume authored hints and **do not fetch**; the third `requestHint()` fetches with `action: "hint"`; when the route returns `budgetExhausted`, `budgetExhausted` flips true and `paidRemaining` is 0.

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement the hook.** Track `freeHintsUsed`/`paidUsed` in state; the free-hint branch pushes an `ai` message from `hints[i]` locally; paid branches `POST /api/ai/partner`, push the structured response, and set `paidUsed`/`budgetExhausted` from the reply. Full code in the file.

- [ ] **Step 4: Run tests, verify pass.**

- [ ] **Step 5: Commit** — `feat(ai): useAiPartner hook (free-hint ladder + budgeted paid calls)`.

### Task 6: AI Partner pane components

**Files:**

- Create: `apps/web/src/components/editor/ai-partner/{ai-partner-pane,assist-meter,message-list,diff-card,quick-actions}.tsx`
- Test: `apps/web/src/components/editor/ai-partner/__tests__/diff-card.test.tsx`

**Interfaces:**

- Consumes: `useAiPartner` (Task 5), `PartnerResponse` types.
- Produces:
  - `AiPartnerPane({ lessonSlug, courseSlug, hints, getCode, getTestSummary, onApply })` — composes the meter + message list + quick actions; owns the hook.
  - `AssistMeter({ freeHintsUsed, paidUsed })` — 6 pips (2 free/green, 4 paid); a11y label with counts.
  - `DiffCard({ current, proposed, rationale, check, onAccept, onReject, stale })` — renders a red/green line diff of `current → proposed`, the rationale, and a **gated Accept**: clicking Accept reveals the `check` (3 options); a correct pick calls `onAccept(proposed)`, a wrong pick shows `check.explanation` and lets them retry. Disabled when `stale`.
  - `QuickActions({ onHint, onPropose, onAsk, disabled, budgetExhausted })`.

The **diff-card is the one with real logic** — build it TDD:

- [ ] **Step 1: Write failing test for DiffCard's accept gate**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiffCard } from "../diff-card";

const check = {
  question: "Why?",
  options: ["A", "B", "C"] as [string, string, string],
  correctIndex: 1 as const,
  explanation: "because B",
};

it("applies only after the correct check answer", () => {
  const onAccept = vi.fn();
  render(
    <DiffCard
      current="a"
      proposed="a\nb"
      rationale="adds b"
      check={check}
      onAccept={onAccept}
      onReject={() => {}}
      stale={false}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /accept/i })); // reveals the check
  fireEvent.click(screen.getByRole("button", { name: "A" })); // wrong
  expect(onAccept).not.toHaveBeenCalled();
  expect(screen.getByText(/because B/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "B" })); // correct
  expect(onAccept).toHaveBeenCalledWith("a\nb");
});

it("Accept is disabled when stale", () => {
  render(
    <DiffCard
      current="a"
      proposed="b"
      rationale=""
      check={check}
      onAccept={() => {}}
      onReject={() => {}}
      stale={true}
    />
  );
  expect(screen.getByRole("button", { name: /accept/i })).toBeDisabled();
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement the five components.** Use the existing design system (chunky cards, `text-success`/`text-danger` for diff lines, focus rings), all copy via `useTranslations("aiPartner")`. For the diff, a simple line-by-line LCS/added-removed render is enough (small files). Full JSX in the files.

- [ ] **Step 4: Run the DiffCard tests, verify pass.**

- [ ] **Step 5: Commit** — `feat(ai): AI Partner pane, assist meter, diff card (accept gate), quick actions`.

### Task 7: Wire the pane into a 3-column layout; remove old in-editor AI

**Files:**

- Modify: `apps/web/src/components/editor/challenge-interface.tsx`

- [ ] **Step 1: Remove the answer-dump + client limiter + Show Solution + vestigial `solution`.** Delete `handleAiHelp` (~L265-323), the `AI Help` and `Show Solution` toolbar buttons, `aiRequestTimestamps` (L83) and its guard (L274-287), `aiLoading`/`aiError` state, the `showSolutionDialog` state + dialog, and the `solution` entry from `ChallengeInterfaceProps` + destructuring (L48). Keep `hints`, `tests`, `initialCode`, `language`, the run/test flow, and the completion flow untouched.

- [ ] **Step 2: Add the 3-column layout.** Wrap the existing brief + editor/output in the first two columns; add `<AiPartnerPane lessonSlug={…} courseSlug={…} hints={hints} getCode={() => code} getTestSummary={() => summarize(challengeState.executionResult)} onApply={(proposed) => setCode(proposed)} />` as the third. Add a `summarize()` helper that turns `executionResult.testResults` into the `"2/3 passing; failing: <names>"` string the hook feeds the route. On small screens, render the pane as a bottom sheet/tab (reuse the existing responsive pattern).

- [ ] **Step 3: Verify build + typecheck** — `cd apps/web && pnpm typecheck` → passes (no dangling `solution`/`handleAiHelp` references).

- [ ] **Step 4: Verify in preview** — run the dev server, open a challenge, confirm: no AI Help/Show Solution buttons; the AI Partner pane renders; Hint serves 2 free authored hints then a paid one; Propose returns a diff card; Accept is gated by the check; applying updates the editor. Fix issues, re-verify.

- [ ] **Step 5: Commit** — `feat(challenge): AI Partner pane in a 3-column layout; remove answer-dump + client limiter`.

---

## Phase 4 — Cleanup, content, i18n, rollout

### Task 8: Remove the floating AI Tutor + dead AI code; retire `/suggest`

**Files:**

- Modify: `lesson-client.tsx` (remove `AiChatSidebar` import + both usages L599/L857 + the toggle button/state ~L588-605; stop passing `solution` to ChallengeInterface).
- Delete: `components/ai/ai-chat-sidebar.tsx`, `app/api/ai/suggest/route.ts`, `components/editor/ai-suggestions.ts`; remove the `AiSuggestion` type from `components/editor/types.ts`.
- Decide `/api/ai/chat`: keep as-is for now (the pane's `ask` uses `/api/ai/partner`), or delete if no other consumer. Grep first: `grep -rn "api/ai/chat" apps/web/src`.

- [ ] **Step 1: Grep for every importer** of the deleted files; confirm none remain outside what this task edits.
- [ ] **Step 2: Delete the files + wiring; remove the `solution` prop pass-through.**
- [ ] **Step 3: `pnpm typecheck` + `pnpm build`** → both pass.
- [ ] **Step 4: Commit** — `chore(ai): remove floating AI Tutor, dead ai-suggestions, and /api/ai/suggest`.

### Task 9: Sanity `tutorNotes` field + re-seed

**Files:**

- Modify: `sanity/schemas/lesson.ts` (add an optional `tutorNotes` text field), `apps/web/src/lib/sanity/queries.ts` (project `tutorNotes` into the server-only `getChallengeAnswerKeyById`, never the client query), the answer-key type.
- Modify: `sanity/seed/*` challenge docs — add a `tutorNotes` line to a couple of challenges to exercise it.

- [ ] **Step 1:** Add the optional field + server-only projection (mirror how `solution` is projected only in the answer-key query, never `getLessonBySlug`).
- [ ] **Step 2:** Thread `tutorNotes` into `buildStaticPrefix` (Task 3 already accepts it as optional).
- [ ] **Step 3:** `pnpm typecheck`; re-run the seed import against David's Sanity (`node sanity/seed/import.mjs`) — this is content, not a DB migration.
- [ ] **Step 4: Commit** — `feat(content): optional tutorNotes on challenges + re-seed`.

### Task 10: i18n

**Files:**

- Modify: `apps/web/src/messages/{en,pt-BR,es}.json` — add the full `aiPartner` namespace (pane title, Hint/Propose/Ask labels, accept/reject, "why?" prompt, budget-exhausted copy, solve summary, a11y labels). Native pt-BR/es, not literal translations.

- [ ] **Step 1:** Add identical keys to all three files.
- [ ] **Step 2: Verify parity** — `node -e "const k=o=>Object.keys(require('./src/messages/'+o+'.json').aiPartner).sort(); const j=JSON.stringify; console.log(j(k('en'))===j(k('pt-BR')) && j(k('en'))===j(k('es')))"` → `true`.
- [ ] **Step 3:** `pnpm build` (missing keys throw) → passes.
- [ ] **Step 4: Commit** — `feat(i18n): aiPartner strings (en/pt-BR/es)`.

### Task 11: Prod DB migration (human-gated) + PR

- [ ] **Step 1:** Open the PR (`feat/ai-partner-challenge-07-07-2026` → `main`). CI + the claude[bot] review are the gates.
- [ ] **Step 2:** After review, apply the `challenge_assists` table + RPCs to David's prod `obqlljsagzslxarwphxv` via the `dbd5cdaf` MCP `apply_migration` — **this is a SENSITIVE prod DB change; it needs explicit human sign-off, never auto-applied.**
- [ ] **Step 3:** Verify the deployed route end-to-end on the Vercel preview against the migrated DB (spend budget, hit the cap, confirm fail-closed).

---

## Self-Review

**Spec coverage:** every spec section maps to a task — §4 loop → Tasks 5-6; §4 budget + §9-§10 fail-closed atomic store → Tasks 1-2, 4; §5 accept gate → Task 6 (DiffCard); §6 UI → Task 7; §7 cost (Flash-Lite, caching instrumented, tight caps) → Tasks 3-4; §8 prompt/schema → Task 3; §9 route → Task 4; §11 diff/staleness → Tasks 6-7; §12 security (hidden tests never in prompt: the route pulls from the server-only answer key and sends only visible tests + solution) → Tasks 3-4; §13 XP unchanged → untouched; §14 removals → Tasks 7-8; content/i18n → Tasks 9-10. Gap check: none.

**Placeholder scan:** backend tasks (1-5) carry complete code + tests; UI tasks (6-7) carry complete code for the logic-bearing DiffCard test and precise per-component contracts + integration steps (routine JSX is specified by contract, not literal placeholders like "TODO"). No `TBD`/"handle edge cases"/"write tests for the above" remain.

**Type consistency:** `PartnerResponse` union (Task 3) is consumed unchanged by the route (Task 4), hook (Task 5), and DiffCard (Task 6); `spendAssist`/`MAX_PAID_ASSISTS` (Task 2) used by the route (Task 4); `check.correctIndex` typed `0|1|2` consistently across the schema, hook, and DiffCard.
