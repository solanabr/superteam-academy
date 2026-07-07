# AI Partner — Challenge Page Redesign (Design Spec)

- **Owners:** Thom & David
- **Status:** Draft for review
- **Date:** 2026-07-07
- **Scope:** The learner-facing challenge/lesson coding page. Replaces the current AI features with a chat-centric, review-driven "AI Partner." The solana-ai-kit capstone is a noted fast-follow, not part of this spec.

---

## 1. Why

Superteam Academy's GTM wedge is **comprehension in an AI world**: _"AI writes the code — you learn why it works."_ The real, hireable skill is directing AI and understanding what it ships — the exact muscle the [solana-ai-kit](https://github.com/solanabr/solana-ai-kit) (a Claude Code / agent-config toolkit) is built around.

The current challenge page works **against** that positioning:

- `AI Help` calls `/api/ai/suggest` (which generates the entire solution) and does `setCode(generatedCode)` — it **dumps the full AI-written answer into the editor** ([challenge-interface.tsx:316](../../../apps/web/src/components/editor/challenge-interface.tsx)). That is "the AI writes it, you ship it" — surrender, not comprehension.
- Three disconnected AI entry points (`AI Help`, `Show Hint`, a floating `AI Tutor` popover) with no coherent model.

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

## 6. UI / layout changes

**Before:** brief (left) │ editor + Output/Tests (right) │ floating `AI Tutor` popover; `AI Help` + `Show Hint` in the editor toolbar.

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

- **Remove** the `AI Help` button (the `setCode(generatedCode)` dump) and the floating AI-Tutor popover.
- **Fold** `Show Hint` into the AI pane's laddered **Hint** action.
- **Add** the persistent **AI Partner pane**: assist meter (pips; first 2 free/green), **diff-card** component (`Reject` / gated `Accept`), **comprehension-check** UI, quick actions `[Hint] [Propose fix]`, and a free-form `Ask…` input.
- **Add** a **solve summary** on all-tests-pass: _"Solved · N assists used"_ (no XP-bonus copy in v1).
- **Mobile:** the AI pane collapses to a bottom sheet / tab (reusing the space today's popover occupies).

Follow existing design-system patterns (chunky cards, Solana yellow/green, focus rings, next-intl for all strings, reduced-motion).

## 7. Cost architecture

Target: **~$0.0002 per AI turn, ~$0.001–0.0015 per challenge per learner at the 6-assist cap.**

Levers:

1. **Model: Gemini 2.5 Flash-Lite** ($0.10/M in · $0.40/M out; cached input $0.01/M). Switch from `gemini-flash-latest`.
2. **Cache-shaped prompt** (§8) — a static per-challenge prefix (≥2,048 tokens, byte-identical across users/turns) so implicit caching fires (90% off the prefix, warm across everyone doing that challenge).
3. **Authored hints are free** — rungs 1-2 never call the model.
4. **Tiny per-intent output caps** — hint ≈120, answer ≈200, diff+check ≈450 tokens. Not a flat 1024.
5. **Hard assist budget** persisted server-side (§4).

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
2. **Assist-budget check** — read persisted `(user, lesson)` assist count; if the action is a paid one and the budget is exhausted, return a budget-exhausted response (not a 5xx).
3. Rate limit + input caps (reuse existing `isRateLimited` + the body/field caps from `/suggest`).
4. Build the cache-shaped prompt (§8), call Flash-Lite with `responseSchema` + per-intent `max_tokens`.
5. Decrement the budget for paid actions; return the structured message.
6. Generic error messages; `GEMINI_API_KEY` absent → 503 (feature disabled, as today).

Client applies the diff and evaluates the check **after** the structured response is in hand (see §8). Free authored-hint rungs are served **without** calling this route (client reads `hints`).

## 10. Assist budget persistence

Persist assists-used per `(user_id, lesson_id)`, resettable when the learner resets the challenge. Candidate stores (decide in the plan): a column on `user_progress`, or a small dedicated table. Must be **server-authoritative** (client cannot mint assists). This is the same counter that bounds worst-case cost.

## 11. Diff application

The AI returns **full proposed code**, not a fuzzy hunk — far more reliable than patch application on a small file. The client diffs `currentCode → proposedCode` and renders only changed lines in the diff card. **Accept** = `setCode(proposedCode)` — but **only after the comprehension check passes**. The "minimal step" is a prompt constraint, so a typical diff is a few lines even though the payload is the whole file.

Staleness: a proposal is computed against a snapshot of the learner's code. If they edit the editor after a proposal is shown, Accept would clobber those edits — so the card is invalidated (disabled with a "re-propose" prompt) when the editor changes after a proposal. Detail for the plan.

## 12. Security

- **Prompt injection:** learner code is delimited and labeled as data; the system prompt forbids treating it as instructions. Input caps (exist) bound cost/abuse.
- **Answer-key safety:** hidden tests never enter the prompt; `solution` is server-only (already never shipped to the client).
- **Cost abuse:** per-user rate limit (exists) + hard per-challenge assist budget (new) + tight output caps.

## 13. XP (unchanged)

XP is awarded **only on submission/completion**, via the existing `/api/lessons/complete` + test executor (hard-gated). The AI Partner has **no XP effects** in v1.

## 14. Component / file impact (for the plan)

- `components/editor/challenge-interface.tsx` — remove `AI Help` + popover wiring; add the AI Partner pane; new 3-column layout.
- **New** `components/editor/ai-partner/` — pane, assist meter, message list, diff card, comprehension check, quick actions, ask input.
- **New** `/api/ai/partner/route.ts`; **remove** `/api/ai/suggest/route.ts`; migrate `/api/ai/chat` behavior in (or keep chat as a thin alias during transition).
- `ai-suggestions.ts` (Monaco decoration helpers) — likely obsolete; remove if unused.
- `lib/…` — assist-budget read/write; the cache-shaped prompt builder; the response schema + types.
- Sanity: optional `tutorNotes` on the lesson/challenge schema; **re-seed** the seed data.
- i18n: all new strings in `messages/{en,pt-BR,es}.json`.

## 15. Open questions / fast-follows

- **ai-kit capstone** — a lesson in the existing "AI x Solana" learning path: install the real kit (`/plugin marketplace add solanabr/solana-ai-kit`), run the same review loop on a real repo (`/audit-solana`, `/test-rust`). Mostly curriculum; sequence after this ships.
- **Comprehension XP / solo bonus** — deferred; revisit once the loop is proven.
- **Streaming** hints/answers for perceived latency — enhancement.
- **Exact empty-budget behavior** (soft stop vs. buy-one-more) — settle in the plan.
- **Budget store** (user_progress column vs. dedicated table) — settle in the plan.
