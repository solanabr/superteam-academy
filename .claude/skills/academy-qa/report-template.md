# Report template

Save as `docs/qa-reports/YYYY-MM-DD.md`. Keep the section order — the value of a
periodic report is that two runs can be read side by side, and a reader should
be able to find the same thing in the same place every time.

Adapt within sections freely. If a section genuinely has nothing in it, write
"No P0/P1 findings this run" rather than deleting it; an absent section is
ambiguous (did you check?), an empty one is a result.

---

```markdown
# Academy QA — YYYY-MM-DD

**Evidence mode:** Running app (local) · Production (read-only) · Static
**Scope:** courses/flows covered this run
**Persona:** e.g. Ana — front-end dev, PT-BR, 375px Android
**Previous report:** YYYY-MM-DD (or "first run")

## Bottom line

**Learner — would I recommend this to a friend starting Solana today?**
Yes / Yes, with caveats / Not yet — one sentence saying why, naming the
caveat that matters most.

**Employer — would I accept this credential in a hiring process?**
Strong signal / Weak signal / Screening only / Not acceptable — one sentence.
To move up one tier, the platform would need to \_\_\_.

## Scorecard

| Dimension                   | Score | Δ   | Why          |
| --------------------------- | ----- | --- | ------------ |
| **Learner**                 |       |     |              |
| Onboarding clarity          | 3     | +1  | one sentence |
| Lesson quality              |       |     |              |
| Content accuracy & currency |       |     |              |
| Localisation quality        |       |     |              |
| Mobile experience           |       |     |              |
| Reasons to come back        |       |     |              |
| **Employer**                |       |     |              |
| Verifiability               |       |     |              |
| Cheat resistance            |       |     |              |
| Job relevance               |       |     |              |
| Depth & coverage            |       |     |              |
| Currency of tooling         |       |     |              |

1 broken · 2 significant gaps · 3 works, unremarkable · 4 good, minor gaps ·
5 genuinely strong

## Since the last report

**Fixed:** findings from last run that are now resolved (say how you confirmed)
**Still open:** carried forward, with any change in severity
**Regressed:** things that were fine and no longer are

_(First run: "No previous report — this run sets the baseline.")_

## Priority list

Both lenses, ranked together — engineering time is one budget.

| #   | Severity | Lens     | Finding  | Who it hits    |
| --- | -------- | -------- | -------- | -------------- |
| 1   | P0       | Employer | one line | all candidates |
| 2   | P1       | Learner  | one line | mobile, PT-BR  |

## Learner findings

Grouped by journey stage. Format each as:

### [Stage] Short title — P1

**What happens:** what a learner experiences, in their terms.
**Evidence:** URL, `file.ts:42`, lesson slug, quoted content, screenshot.
**Why it matters:** consequence — drop-off, confusion, lost work.
**Fix:** the specific change.

**Quit point:** the moment a real learner would most likely stop, and why.

## Employer findings

Same format, grouped by the six questions (what's claimed · verifiability ·
cheat resistance · job relevance · discrimination · currency).

Include the one-sentence statement of what the credential actually certifies.

## What's strong

Specific things worth protecting — named as precisely as the problems, so the
team knows what not to break.

## Not checked

What this run could not cover and why (no test wallet, couldn't run the app,
forum out of scope). This is what makes the rest trustworthy.

## Next run

Scope to rotate in, plus anything this run flagged as worth re-testing once
fixed.
```

---

## A worked finding, for calibration

The difference between a report that gets acted on and one that gets skimmed is
almost entirely in this level of specificity.

**Too vague — don't do this:**

> The quizzes could be more challenging and better test understanding.

**Sharp — do this:**

> ### [Content] Quiz answers are guessable without reading the lesson — P1
>
> **What happens:** In `solana-speedrun` lesson 2, the question "What is a
> keypair?" offers four options where the correct one is the only one longer
> than four words and the only one that isn't a joke ("a pair of shoes").
> A learner can score 100% without opening the lesson.
> **Evidence:** `content/generated/lessons.json`, lesson `lesson-keypairs`,
> quiz block `q1`; quoted above.
> **Why it matters:** This is the assessment the credential rests on. An
> employer who spot-checks it stops trusting the rest.
> **Fix:** Replace joke distractors with plausible near-misses (e.g. "a public
> key derived from a seed phrase") so passing requires the distinction the
> lesson teaches.
