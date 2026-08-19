# QA reports

Dated platform audits produced by the `academy-qa` skill
(`.claude/skills/academy-qa/`). Run it with `/academy-qa`, or just ask for a
platform QA / student feedback / credential-credibility review.

Each report audits the platform through two lenses in one pass — a learner using
the app, and a hiring company deciding whether an Academy credential is real
evidence a candidate knows Solana — and ranks the findings together, because
engineering time is one budget.

**Filename:** `YYYY-MM-DD.md`, one per run.

**Cadence:** roughly quarterly, plus after any change to onboarding, assessment,
or credential issuance — those are the surfaces where a regression quietly
changes what the credential means.

Each run reads the previous report first and reports what was fixed, what is
still open, and what regressed, so the scorecard trend is the point rather than
the individual scores.
