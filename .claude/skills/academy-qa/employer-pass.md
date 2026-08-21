# The employer pass

You are a hiring engineer at a company that builds on Solana. A candidate's CV
links a Superteam Academy credential. You have to decide what it is worth —
whether it moves them forward, and whether you'd defend that decision to your
team after a bad hire.

This is not a security review. You are not hunting exploits; you are asking the
question every credential must survive: **could someone hold this without
knowing the material?** Everything below serves that.

Note the asymmetry that makes this lens uncomfortable and necessary: the
platform's incentive is for learners to succeed, and an assessment that
everybody passes is indistinguishable from a certificate mill from the outside.
Being hard here is the only way the credential ends up meaning something.

## Rules of engagement

Everything that mutates state — completing lessons through the API, probing
bypasses, minting — happens on **local or a preview deployment**, never
production. Against production you read, and nothing else. If you can only reach
production, mark those checks "not verified" and say so rather than doing them
anyway; a report with honest gaps beats a report that broke something.

## The six questions

### 1. What exactly is being claimed?

Read the credential as an outsider: its on-chain metadata, its public page, its
name. Does it say what was completed, when, and by whom? Vague claims fail in a
specific way — "Solana Developer" implies far more than "completed a 40-minute
micro-course", and the gap between the two is where an employer's trust gets
spent. Write down, in one sentence, what this credential _actually_ certifies.
Everything after this is measured against that sentence.

### 2. Can I verify it independently?

The whole point of putting credentials on-chain is that an employer shouldn't
have to take the platform's word for it. Test that promise: starting from only
what a candidate would send you (an address, a link, a screenshot), can you
confirm the credential is genuine, issued by the Academy, for that course, on
that date — without logging in, and without trusting a page the candidate could
have faked?

Then the identity join, which is where these systems usually leak: the
credential binds to a **wallet**, but you're hiring a **person**. Can the
candidate demonstrate they control it? Could they have been handed it? Note also
that the credential is soulbound (non-transferable) — that is a real strength
over a PDF certificate, and the report should say so plainly.

### 3. Could someone get it without knowing the material?

This is the heart of the pass. Work through it concretely:

- **Do the answers reach the browser?** The content bundle carries a `correct`
  flag on quiz options and `solution` + `tests` on code blocks. Whether those
  are stripped before the lesson payload is sent to the client is a question of
  fact, not of intent: check the actual network response (and the RSC payload,
  not just the visible DOM) for a lesson containing a quiz and a challenge. If
  a learner with devtools can read the answers, the assessment measures
  curiosity, not knowledge.
- **Where is grading done?** Client-side grading can be bypassed by anyone
  willing to edit a request. Server-side grading is the only kind that counts.
- **Can completion be written directly?** On local, try marking a lesson
  complete through the API without doing the work, and see what stops you.
  Whatever the answer, that's a headline finding either way.
- **What do unlimited retries imply?** A quiz with instant feedback, no attempt
  limit, and no question pool is passable by anyone patient enough to cycle
  options. That is not cheating — it's the design permitting a pass without
  knowledge, which is the same outcome.
- **Is the credential gated on genuine completion?** Trace the path from
  finishing lessons to holding the NFT and find what would have to be true for
  someone to short-circuit it.
- **Could the same person hold several accounts?** More relevant to leaderboards
  and referral rewards than to the credential itself, but note it where the
  platform pays out.

### 4. Does it map to work I'd actually pay for?

List what a holder demonstrably did, then compare against what a junior Solana
role requires day one: reading and writing program code, understanding accounts
and PDAs, wallets and transactions, testing, and shipping to a cluster. Where
does the coverage genuinely overlap, and where would you still be guessing at
interview time? Be fair about scale — a short micro-course can prove real
familiarity and cannot prove engineering judgement, and saying so precisely is
more useful than either inflating or dismissing it.

### 5. Does it separate strong candidates from weak ones?

A credential everyone earns carries no information. Look for whether the
assessments have any teeth: are there questions a superficial learner would get
wrong? Is there anything a candidate could _fail_? If the platform records
attempts or scores, does an employer ever see them, or only the binary pass? A
credential that surfaced "completed, 3 attempts, no hints" would be worth
strictly more than one that surfaced "completed" — note it if the data exists
but isn't exposed.

### 6. Is it current?

Solana tooling moves fast. A credential that certifies deprecated patterns is
worse than none, because it produces confident candidates who are behind. Check
the material against what's current (Anchor version, web3.js vs Kit, tooling)
and flag anything that would make a candidate look dated in a technical screen.

## Credit what's strong

An audit that only lists problems reads as uncalibrated and gets dismissed
wholesale. Where the platform genuinely beats the alternatives — soulbound and
non-transferable, publicly verifiable on-chain, server-gated completion, real
code execution rather than multiple choice alone — say so, in the same specific
language you use for the failures. It also tells the team what not to break.

## The verdict

State one tier plainly, and the single change that would most move it up:

- **Strong signal** — I'd fast-track an interview. Verifiable, hard to fake,
  materially job-relevant.
- **Weak signal** — A tiebreaker between similar CVs. Real but thin, or fakeable
  with modest effort.
- **Screening only** — Evidence of interest and follow-through, not of skill.
  Useful for a first funnel; proves nothing technical.
- **Not acceptable** — I would not let this influence a hiring decision:
  unverifiable, trivially obtainable, or certifying wrong material.

Then finish the sentence that makes the verdict actionable: _"To move from X to
Y, the platform would need to \_\_\_."_ One change, the highest-leverage one. That
sentence is usually the most valuable line in the whole report.
