# AI Partner — Challenge Page Redesign (Design Spec)

- **Owners:** Thom & David
- **Status:** Draft for review
- **Date:** 2026-07-07
- **Scope:** The learner-facing challenge/lesson coding page. Replaces the current AI features with a chat-centric, review-driven "AI Partner." The solana-ai-kit capstone is a noted fast-follow, not part of this spec.

---

## 1. Why

Superteam Academy's GTM wedge is **comprehension in an AI world**: _"AI writes the code — you learn why it works."_ The real, hireable skill is directing AI and understanding what it ships — the exact muscle the [solana-ai-kit](https://github.com/solanabr/solana-ai-kit) (a Claude Code / agent-config toolkit) is built around.

The current challenge page works **against** that positioning:

- `AI Help` calls `/api/ai/suggest` (which generates the entire solution) and does `setCode(generatedCode)` (`challenge-interface.tsx` ~L320) — it **dumps the full AI-written answer into the editor**. That is "the AI writes it, you ship it" — surrender, not comprehension.
- The AI is scattered across **four** disconnected surfaces: `AI Help`, `Show Hint`, and `Show Solution` in the editor toolbar, plus a separate floating **"AI Tutor"** chat widget (`components/ai/ai-chat-sidebar.tsx`, wired in `lesson-client.tsx`) — no coherent model.

**This redesign makes the challenge page a miniature of the ai-kit workflow: ask the AI → review its proposed diff → prove you understand it → merge.** No AI line lands without being understood. It's the professional review loop _and_ the comprehension gate, fused — a pattern ("review-to-learn") no generic coding-education platform ships.

## 2. Goals

- Replace the answer-dump with a **propose → review → understand → accept** loop.
- Make the AI **chat-centric** and first-class (a persistent pane, not a popover).
- Force comprehension at the moment code lands (an **accept gate**).
- Be **provably cheap** at scale (target: ~$0.001 per challenge per learner at the interaction cap).
- Rehearse the ai-kit workflow so a later capstone graduates learners onto the real kit.

## 3. Non-goals (v1)

- **No XP/scoring changes.** XP is still awarded only on submission/completion, hard-gated by the existing test executor. The accept gate is purely pedagogical (gates the _apply_, not XP). Gamifying comprehension is deferred.
- **No literal patch/hunk application.** The AI returns full proposed code; the diff is a client-side visualization (see §8).
- **The ai-kit capstone lesson** is a fast-follow (see §12).
- **No streaming** in v1 (noted as an enhancement).

## 4. The interaction loop (review-to-learn)

The AI is one **persistent AI Partner pane**. All interaction is a conversation with _structured, reviewable_ messages. Learner actions:

1. **Hint (laddered).**
   - Rungs 1-2: **free authored hints** from the lesson's existing `hints` array — **no AI call**.
   - Rung 3+: a personalized AI hint grounded in the learner's current code (spends one assist).
2. **Propose a fix.** The AI returns a **diff card** (Cursor-style): the changed lines + a one-line rationale + an accept-gate check. Spends one assist. The AI is instructed to propose the _smallest_ step forward, not the whole solution.
3. **Accept (gated) / Reject.** Reject is free. **Accept is locked behind a comprehension check** (§5): answer correctly → the change applies to the editor. Miss it → the AI explains, retry.
4. **Ask…** free-form question, answered Socratically (spends one assist).
5. **Run tests** — deterministic, free, and feeds results into the AI's context so hints/proposals are grounded in what's failing.

### Assist budget

A visible **assist meter** per (learner, challenge): a **6-pip budget = 2 free authored-hint pips + 4 paid AI-assist pips** (so paid model calls are capped at 4 → predictable worst-case cost). Persisted server-side so a refresh can't reset it; resets when the learner **resets** the challenge. Empty = _"You've got this — finish on your own"_ (final empty-state behavior — soft stop vs. buy-one-more — settled in the plan; see §15). The meter is both the cost ceiling and a "try first" nudge.

## 5. The accept gate (comprehension check)

Because the diff is **dynamic** (depends on the learner's code), its check can't be pre-authored. So the AI returns the diff **and** a 3-option "why is this right?" check **in the same structured response** (one call, ~100 extra output tokens).

- Correct answer → the change applies to the editor.
- Wrong answer → show the AI's short explanation, let them retry the check.
- v1: **no XP** attached (avoids needing to server-verify a generated MCQ). Completion XP remains the hard-gated reward.
- **Threat model:** since `correctIndex` is returned to the client, the check is client-evaluated and trivially bypassable (DevTools). Acceptable _only_ because it gates nothing of value — not XP, not completion (completion stays hard-gated server-side by `validateAgainstAnswerKey`). It is a comprehension nudge, not a security control.

## 6. UI / layout changes

**Before:** brief (left) │ editor + Output/Tests (right) │ a separate floating **AI Tutor** chat widget; `AI Help` + `Show Hint` + `Show Solution` in the editor toolbar.

**After** — three columns (the Cursor layout):

```
┌────────────┬──────────────────────────┬───────────────────────────┐
│ BRIEF       │ EDITOR (Monaco)          │ AI PARTNER   ●●●○○○ assists│
│ (collapse ◀)│  struct AccountMeta {…}  │              (2 free · grn)│
│ Challenge…  │                          │ ┌───────────────────────┐ │
│ Your task   │ [▶ Run tests] [Reset]    │ │ proposed diff  + why  │ │
│ 1. …        │ ┌ Output / Tests ──────┐ │ │  + rationale          │ │
│ 2. …        │ │ ✓ 2 / 3 passing      │ │ │ [Reject] [Accept ▸]   │ │
│             │ └──────────────────────┘ │ │  Accept → "why?" check│ │
│             │                          │ └───────────────────────┘ │
│             │                          │ …chat history…            │
│             │                          │ [Hint][Propose fix][Ask…▸]│
└────────────┴──────────────────────────┴───────────────────────────┘
```

Concretely, on the challenge page (`components/editor/challenge-interface.tsx` and friends):

- **Remove** `AI Help` (the `setCode(generatedCode)` dump), `Show Solution`, and the floating **AI Tutor** widget (`ai-chat-sidebar.tsx`) — see §14 for the full file list.
- **Fold** `Show Hint` into the AI pane's laddered **Hint** action.
- **Add** the persistent **AI Partner pane**: assist meter (pips; first 2 free/green), **diff-card** component (`Reject` / gated `Accept`), **comprehension-check** UI, quick actions `[Hint] [Propose fix]`, and a free-form `Ask…` input.
- **Add** a **solve summary** on all-tests-pass: _"Solved · N assists used"_ (no XP-bonus copy in v1).
- **Mobile:** the AI pane collapses to a bottom sheet / tab (reusing the space today's popover occupies).

Follow existing design-system patterns (chunky cards, Solana yellow/green, focus rings, next-intl for all strings, reduced-motion).

## 7. Cost architecture

**The hard guarantee is the assist cap, not caching.** Worst-case cost is bounded by **4 paid model calls per challenge** (§4) whether or not caching fires. Implicit caching is a _discount on top_ — never a load-bearing assumption. Flash-Lite implicit caching is documented-flaky (field reports show `cachedContentTokenCount` staying 0 below ~3k-token prefixes; the Flash-family minimum is ~1,024 tokens and hits are unreliable near it), so we **size and measure, not assume**.

- **Uncached** (the number we guarantee): prefix ~2.5k × $0.10/M + suffix ~0.75k × $0.10/M + output ~450 × $0.40/M ≈ **$0.0005/turn** → **≤ ~$0.002 per challenge** at 4 paid calls.
- **Cached** (when it fires): the prefix bills at $0.03/M instead of $0.10/M → ~$0.0003/turn.
- Either way it's fractions of a cent: 1,000 learners × 30 challenges maxing the cap ≈ **$60 uncached**, less with cache hits.

Levers:

1. **Model: Gemini 2.5 Flash-Lite** ($0.10/M in · $0.40/M out; cached input **$0.03/M**). Switch from `gemini-flash-latest`.
2. **Cache-shaped prompt** (§8) — a static per-challenge prefix, byte-identical across users/turns, sized to **~3k+ tokens** to give implicit caching a real chance. Treated as a nice-to-have discount.
3. **Instrument it** (acceptance criterion): log `usageMetadata.cachedContentTokenCount` per call and confirm hits actually fire in staging before quoting the cheap number. If implicit caching proves unreliable, fall back to **explicit caching** (`cachedContents`, keyed per challenge) — reliable but adds a ~$1/hr-per-cache storage cost to model against traffic.
4. **Authored hints are free** — rungs 1-2 never call the model.
5. **Tiny per-intent output caps** — hint ≈120, answer ≈200, diff+check ≈450 tokens. Not a flat 1024.
6. **Hard, fail-closed assist budget** (§4, §9, §10) — the real ceiling.

## 8. Data & prompt contract

### Content model (Sanity)

- **Reuse** the lesson's existing `hints` (free ladder), `solution` (reference answer, server-only), and **visible** tests.
- **Optional new field** `tutorNotes` (short author note: the key concept + common mistakes) to steer hint/check quality. Optional — challenges without it still work (the AI derives focus from task + solution). We may add it and re-seed Sanity.
- **Hidden tests are never sent to the model** — no answer-key leak through AI output.

### Prompt shape (for cache hits)

```
[ STATIC PREFIX ]   — identical per challenge, cached
  system prompt (tutor persona + rules + JSON output schema)
  challenge task/brief
  visible tests
  reference solution
  tutorNotes (if present)

[ DYNAMIC SUFFIX ]  — per turn, fresh
  learner's current editor code (clearly delimited as data)
  latest test-run results (pass/fail summary)
  last 2-3 turns of chat
  the requested action (hint | propose | ask)
```

Rules: never put per-user data, timestamps, or randomness in the prefix (would break the cache). Treat learner code strictly as data, never as instructions (prompt-injection guard).

### Structured output (JSON, response schema)

The AI returns one typed object per action:

- `hint` → `{ type, text }`
- `propose` → `{ type, rationale, proposedCode, check: { question, options[3], correctIndex, explanation } }`
- `ask` → `{ type, text }`

`proposedCode` is the **full updated file**; the client computes and renders the diff (§ below). Enforced via Gemini `responseSchema` / JSON mode with tight `max_tokens`.

## 9. API — `/api/ai/partner`

One new route that **replaces `/api/ai/suggest`** and **folds in `/api/ai/chat`**. Behavior:

1. Auth (Supabase `getUser`) — 401 if absent (matches existing routes).
2. **Assist-budget check + decrement — fail-closed and atomic.** A single SECURITY DEFINER RPC does the read-modify-write in one call (the pattern of `check_rate_limit` / `award_xp`): if a paid action would exceed the budget, **or the DB read/write fails**, deny it (return a budget-exhausted response, not a 5xx). This is the cost ceiling, so it must **not** mirror `isRateLimited` (which fails _open_ by design). One atomic step — no client-visible read-then-write — so concurrent requests can't race past the cap.
3. Rate limit + input caps — reuse existing `isRateLimited` (abuse-mitigation only; it fails open, so it is **not** the ceiling) + the body/field caps from `/suggest`.
4. Build the cache-shaped prompt (§8), call Flash-Lite with `responseSchema` + per-intent `max_tokens`.
5. Return the structured message (the decrement already happened atomically in step 2 for paid actions).
6. Generic error messages; `GEMINI_API_KEY` absent → 503 (feature disabled, as today).

Client applies the diff and evaluates the check **after** the structured response is in hand (see §8). Free authored-hint rungs are served **without** calling this route (client reads `hints`).

## 10. Assist budget persistence

Persist assists-used per `(user_id, lesson_id)` in a **dedicated table**, resettable when the learner resets the challenge. Do **not** put it on `user_progress`: those rows are created only at completion (by `/api/lessons/complete`), and its `completed` / `completed_at` constraint (`chk_user_progress_completed_at_requires_completed`) is muddied by a counter that must exist from the _first_ assist. Follow the existing `user_daily_quests (user_id, quest_id, current_value INTEGER, UNIQUE(...))` precedent — e.g. `challenge_assists (user_id, lesson_id, assists_used INT, UNIQUE(user_id, lesson_id))`, read+written via the fail-closed SECURITY DEFINER RPC (§9). Server-authoritative — the client cannot mint assists.

## 11. Diff application

The AI returns **full proposed code**, not a fuzzy hunk — far more reliable than patch application on a small file. The client diffs `currentCode → proposedCode` and renders only changed lines in the diff card. **Accept** = `setCode(proposedCode)` — but **only after the comprehension check passes**. The "minimal step" is a prompt constraint, so a typical diff is a few lines even though the payload is the whole file.

**Staleness (firm requirement, not a detail):** capture a hash of the learner's `code` when a proposal is requested. On Accept, if the live `code` hash differs, **disable Accept** and prompt to re-propose — never silently `setCode` over edits the learner made after the proposal. Invalidate on hash-mismatch _at Accept time_, not on every keypress (which would be over-eager). Note the editor autosaves per lesson (`resetEditorStorage(lessonId)` exists), so the snapshot must come from live `code` state, not storage.

## 12. Security

- **Prompt injection:** learner code is delimited and labeled as data; the system prompt forbids treating it as instructions. Input caps (exist) bound cost/abuse.
- **Answer-key safety:** hidden tests never enter the prompt; `solution` is server-only (already never shipped to the client).
- **Cost abuse:** the **fail-closed** assist budget (§9-§10) is the ceiling; the existing per-user rate limit (fails _open_ — mitigation only) and tight output caps are secondary.

## 13. XP (unchanged)

XP is awarded **only on submission/completion**, via the existing `/api/lessons/complete` + test executor (hard-gated). The AI Partner has **no XP effects** in v1.

## 14. Component / file impact (for the plan)

- `components/editor/challenge-interface.tsx` — remove `AI Help` (the `setCode` dump, ~L320), `Show Hint`, `Show Solution`, the **client-only** rate limiter (`aiRequestTimestamps`, 3/5min), and the vestigial `solution` prop / Show-Solution UI (the live page never populates it); add the AI Partner pane + 3-column layout.
- `app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx` — remove the floating **AI Tutor** wiring + its toggle button/state (~L588-605).
- **Remove** `components/ai/ai-chat-sidebar.tsx` (the floating "AI Tutor" chat, incl. its client-only `MAX_MESSAGES_PER_LESSON = 5` counter that resets on refresh) — its role moves into the AI Partner pane. **The server assist budget is the single source of truth for interaction limits** (delete both client-side counters so they can't shadow it).
- **New** `components/editor/ai-partner/` — pane, assist meter, message list, diff card, comprehension check, quick actions, ask input.
- **New** `/api/ai/partner/route.ts`; **remove** `/api/ai/suggest/route.ts`; fold `/api/ai/chat` behavior in (or keep `/chat` as a thin alias during transition).
- **Remove** `components/editor/ai-suggestions.ts` — confirmed dead code (no importers) — and the unused `AiSuggestion` type in `types.ts`.
- `lib/…` — the fail-closed assist-budget RPC wrapper; the cache-shaped prompt builder; the response schema + types.
- DB: new `challenge_assists` table + its fail-closed SECURITY DEFINER RPC (migration applied to David's prod after review).
- Sanity: optional `tutorNotes` on the lesson/challenge schema; **re-seed** the seed data.
- i18n: all new strings in `messages/{en,pt-BR,es}.json`.

## 15. Open questions / fast-follows

- **ai-kit capstone** — a lesson in the existing "AI x Solana" learning path: install the real kit (`/plugin marketplace add solanabr/solana-ai-kit`), run the same review loop on a real repo (`/audit-solana`, `/test-rust`). Mostly curriculum; sequence after this ships.
- **Comprehension XP / solo bonus** — deferred; revisit once the loop is proven.
- **Streaming** hints/answers for perceived latency — enhancement.
- **Exact empty-budget behavior** (soft stop vs. buy-one-more) — settle in the plan.
