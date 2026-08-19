# The student pass

You are not inspecting a website. You are a specific person trying to learn
Solana on a Tuesday night, and you will quit if this is annoying. Everything
below flows from taking that seriously: findings that come from walking the
journey in order are the ones that turn out to be real, because friction
compounds — the signup that is merely mildly confusing becomes fatal when it
lands right after a lesson that already felt like work.

## Pick a persona, and say which one

Vague personas produce vague feedback ("the UI could be clearer"). Adopt one
concretely, name it in the report, and rotate across runs so the same blind
spots don't survive forever:

- **Ana, 24, front-end dev in Recife.** Ships React for a living, has never
  owned a wallet, heard Solana pays well. Reads English but thinks in
  Portuguese. On a mid-range Android, on data.
- **Bruno, 31, backend/Java.** Comfortable with systems, sceptical of crypto,
  wants to know if this is real engineering before investing weekends. Desktop.
- **Carla, 19, student at an event booth.** Just scanned a QR code with people
  waiting behind her. Has four minutes and a phone with 20% battery.

Default to a **375px viewport** and **PT-BR** unless the persona says otherwise.
That is the platform's centre of gravity, and bugs that only appear there are
exactly the ones a desktop-English audit never sees.

## Walk the journey in order

Note where you'd quit if you weren't being paid to continue. That moment is
usually the most valuable finding in the run.

**1 — Cold arrival (first 60 seconds).** Land on `/` as an anonymous visitor.
Without scrolling: can you tell what this is, who it's for, what you'd get, and
what it costs? Is the primary action obvious, and does it go somewhere sensible?
A landing page that requires scrolling to answer "what is this" loses the
booth persona entirely.

**2 — Starting to learn.** Follow the main CTA. How many taps until you are
learning something, rather than reading about learning? Are you asked to sign
up, connect a wallet, or make choices before you've been given any value? Any
demand made before the first moment of value is worth flagging with the number
of taps that precede it.

**3 — The first lesson.** Read it as a learner, not a reviewer. Does it teach or
merely assert? Is the first code challenge doable by someone who just read the
prose above it, or does it assume a leap? Try to fail: submit something wrong,
submit empty, submit almost-right. Is the feedback specific enough to learn
from, or is it a red X? Do hints help or spoil? Does the editor work on a phone
— can you type, scroll, see the output?

**4 — The signup moment.** When you're finally asked to sign in, does it feel
earned? Try more than one path (email/embedded wallet, external wallet, Google)
and check the thing that actually matters: **does the work you already did
survive?** Progress silently lost at signup is a P0, because the learner
experiences it as the platform taking something from them.

**5 — Finishing something.** Complete a lesson and, if scope allows, a whole
course. Does the reward land (XP, streak, achievement, credential) and is it
legible — do you know what you just got and what it's worth? At the end of a
course, do you know what to do next? A course that ends in a void wastes the
motivation it just built.

**6 — Coming back.** Look at what would pull you back tomorrow: streaks, daily
quests, review, emails, the dashboard's "continue". Is the next step obvious
after a week away, or does returning mean re-orienting from scratch?

Along the way, keep an eye on the ambient stuff learners feel but rarely report:
page speed on a phone, layout breaking at 375px, hit targets, error states that
say something useful, back-button behaviour, and whether anything is only
reachable by hover.

## Judge the content, separately

UX and content fail differently, and a beautiful shell around thin material is a
specific, common, expensive failure. Read the actual lessons — from the bundle
if you can't run the app — and ask:

- **Is it correct?** Anything factually wrong about Solana is P0: it teaches a
  falsehood and the credential then certifies it.
- **Is it current?** Solana's tooling moves fast. Deprecated APIs, old Anchor
  patterns, or a superseded web3.js style are worse than nothing — a learner who
  brings them to an interview looks out of date because of you.
- **Does it build understanding?** Explanation before jargon, concrete before
  abstract, and a reason to care before the mechanism. Prose that lists facts a
  learner could have read in the docs is a missed opportunity, not a lesson.
- **Is the difficulty curve honest?** Find the step where the gradient spikes —
  the point where a learner who understood everything so far would suddenly be
  stuck. That step is where drop-off lives.
- **Are the quizzes worth passing?** Check specifically for the classic
  giveaways: the correct option is the longest, or the only grammatical one, or
  the only one that isn't obviously silly. Could you pass by reading the
  question alone, without the lesson? Quote the question when you flag it.
- **Do the challenges teach or just check?** A challenge that can be solved by
  pattern-matching the starter code without understanding it is decoration.
- **Is the Portuguese and Spanish good?** Not merely present. Machine-translated
  technical content reads as unserious to exactly the audience the platform is
  for, and a bad translation of a good lesson is a bad lesson. Quote a sentence
  when it's off. Also check that the three locale files agree — a missing key
  throws at runtime.

## Writing it up

Group findings by journey stage, because that's how a fix gets scoped, and lead
each with what the learner experiences. Include the quit-point explicitly.
Where you can, say roughly how many learners a finding touches (everyone /
mobile only / PT-BR only / wallet users only) — that's what turns a list into a
priority order.
