---
name: academy-qa
description: Periodic quality audit of the Superteam Academy platform through two lenses at once — a learner using the app (UX friction + content quality) and a hiring company deciding whether an Academy credential is real evidence a candidate knows Solana. Produces a dated, prioritised report in docs/qa-reports/ that diffs against the previous run. Use this whenever the user asks to QA/audit/review the platform or the courses, wants student or learner feedback, questions whether the credentials are credible or gameable, asks "is this good enough to show an employer", wants to know what to improve next, or asks for a periodic/quarterly platform review — even if they don't say the words "QA" or "audit".
user-invocable: true
---

# Academy QA — two lenses, one report

## Why two lenses

The platform makes two promises, to two different parties, and it only works if
both hold:

- **To the learner**: spend your evenings here and you will actually learn to
  build on Solana.
- **To the employer**: this credential means the person holding it knows what it
  says they know.

These fail independently and for different reasons. A course can be delightful
to use and still be worthless as hiring signal (everything guessable, nothing
verifiable). A course can be rigorous and still lose every learner at signup.
Auditing only one lens is how a platform ends up excellent at the thing nobody
was complaining about.

So every run produces findings from both, in one report, prioritised together —
because engineering time is one budget.

## Run it in this order

1. **Read the last report** — `ls docs/qa-reports/` and read the most recent.
   You are continuing an argument, not starting one. It tells you what was
   already reported (don't re-litigate), what was promised, and what to rotate
   into scope this time.
2. **Pick an evidence mode** (below). Prefer a running app.
3. **Choose scope** — which courses and which flows. With few courses, cover
   all; as the catalogue grows, cover the entry courses every time and rotate
   the rest, using the last report to see what's overdue.
4. **Run the student pass** → read `student-pass.md`.
5. **Run the employer pass** → read `employer-pass.md`.
6. **Write the report** → use `report-template.md`, save to
   `docs/qa-reports/YYYY-MM-DD.md`.
7. **Offer the follow-through** — ask whether to open issues or PRs for the P0/P1
   findings. A report nobody acts on was a waste of everyone's time.

`platform-map.md` says where everything lives — read it early so you spend your
time evaluating rather than rediscovering the codebase.

## Evidence modes

Pick the richest one available and say in the report which you used, because it
bounds what the findings are worth.

- **A — Running app (best).** Local dev (`pnpm dev` in `apps/web`) or a preview
  deployment. Drive it with Playwright (Chromium is preinstalled; see
  `platform-map.md`). This is the only mode that catches what learners actually
  hit: layout breakage, dead ends, slow pages, broken flows.
- **B — Production, read-only.** Real content, real data, real performance. Good
  for UX truth when you can't run the app.
- **C — Code + content bundle only.** Always possible, needs no credentials.
  Content quality, wording, i18n coverage, and much of the cheat-resistance
  surface are all auditable statically by reading what the server sends.

**Safety line.** Against production, behave like a learner and nothing more:
browse, and if you sign in, use a dedicated test account. Never run admin
actions, never trigger on-chain writes (they cost real SOL and are often
irreversible), never touch another user's data, and never write to the
production database. Anything that mutates state — completing lessons via the
API, testing bypasses, minting — belongs in local or a preview environment.
If you can only reach production, say so and mark those checks "not verified"
rather than doing them anyway.

## What makes a finding worth writing down

The failure mode of a platform audit is a long list of things that could be said
about any website. "Improve onboarding", "add more tests", "consider better
error messages" — all true, all useless, all indistinguishable from having done
no work. Aim for the opposite: a short list a developer can act on this
afternoon without asking you a single follow-up question.

Every finding carries four things:

- **Evidence** — where you saw it. A URL, a `file.ts:42`, a lesson slug, a
  quoted sentence from the content, a screenshot. If you can't point at it, you
  didn't find it.
- **The user consequence** — what a real person experiences. Not "the button is
  misaligned" but "on a 375px phone the Enrol button sits under the fold, so a
  learner who taps through from the QR code sees a course page with no obvious
  way in".
- **Severity** — P0/P1/P2/P3, defined below.
- **A concrete fix** — the change you'd make. Naming the file is better than
  naming the feeling.

Two habits that keep a report honest:

- **Quote the content you're critiquing.** "Lesson 3's quiz is weak" is an
  opinion; quoting the question and showing that the correct answer is the only
  one that is grammatically plausible is a finding.
- **Keep a "not checked" list.** Every audit has gaps — no test wallet, couldn't
  run the app, didn't cover the community forum. Writing them down is what makes
  the rest of the report trustworthy, and it seeds the next run's scope.

Prefer eight sharp findings to forty mushy ones. If a section has nothing real
in it, say so — "no P0/P1 issues found in the enrolment flow" is a genuine
result and reads as confidence, not laziness.

## Severity

Severity is about consequence, not effort:

- **P0** — A learner is blocked, or the credential's meaning is broken. Enrolment
  fails; lessons can be completed without doing them; a credential can be
  obtained by someone who knows nothing; content teaches something factually
  wrong about Solana.
- **P1** — Materially loses learners or materially weakens the hiring signal.
  A confusing signup that costs most drop-offs; quizzes passable by guessing;
  a credential an employer can't verify; badly machine-translated PT-BR on the
  primary audience's happy path.
- **P2** — Real friction or a real weakness, survivable. Confusing copy, a rough
  mobile layout, a shallow module, a missing "what next".
- **P3** — Polish. Worth listing so it can be batched.

Note who each finding hits — all learners, mobile only, PT-BR speakers, wallet
users vs email users. A P2 that hits everyone often beats a P1 that hits a
sliver, and the report should let a reader make that call.

## The scorecard

The report opens with a small scorecard, 1–5 per dimension, because the value of
a periodic audit is the _trend_: this only means something when compared with
the previous run. Score honestly and hold the anchors steady between runs —
a scorecard that drifts upward because the auditor got friendlier measures
nothing.

Anchors: **1** broken · **2** significant gaps · **3** works, unremarkable ·
**4** good, minor gaps · **5** genuinely strong.

**Learner:** onboarding clarity · lesson quality · content accuracy & currency ·
localisation quality · mobile experience · reasons to come back
**Employer:** verifiability · cheat resistance · job relevance · depth &
coverage · currency of tooling

Every score needs one sentence of justification and, if it moved, why. A score
with no sentence is a number someone made up.

## Both bottom lines

Findings are inputs; a decision is the output. The report states two verdicts
plainly, each with the one change that would most move it:

- **Learner**: would you recommend this to a friend starting Solana today?
  _Yes / Yes, with caveats / Not yet_ — and the caveat that matters most.
- **Employer**: would you accept this credential in a hiring process?
  _Strong signal / Weak signal / Screening only / Not acceptable_ — and what
  would have to be true to move up one tier.

Being straight here is the most useful thing in the document. A hedged verdict
protects nobody and tells the team nothing.

## Delivering it

Save to `docs/qa-reports/YYYY-MM-DD.md`, then give the user, in chat: the two
verdicts, the scorecard deltas, and the P0/P1 list — enough to act on without
opening the file. Offer to turn the top findings into issues or PRs.

If the platform has genuinely improved since the last run, say which findings
were fixed. Teams need to see the loop close.
