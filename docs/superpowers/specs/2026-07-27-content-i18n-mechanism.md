# Content-i18n mechanism design (the PT-BR moat) — LX-D5 / D-5

**Status:** design-only. Tees up owner decision **D-5**. No code, no schema, no
content ships from this doc; implementation is a later issue once the owner picks
a mechanism.

**Issue:** #580 · **Spec task:** LX-D5 (launch-experience master spec §3, size
**L**, P2-post) · **Decision:** D-5 (master spec §7)

---

## 1. Problem and constraints

PT-BR **original** content is the stated moat — every incumbent ships stale 2022
machine translations, so first-party PT-BR is the differentiator. Today the
content repo (`solanabr/courses-academy`) is **English end-to-end**, and
`next-intl` localizes only the app _chrome_ (`apps/web/src/messages/{en,pt-BR,es}.json`);
lesson prose, quiz text, hints, and failure messages have no locale dimension at
all. `apps/web/src/lib/i18n/config.ts` already declares `locales = ["en","pt-BR","es"]`,
`defaultLocale = "en"`.

Four separately-filed recommendations silently depend on one mechanism existing,
and it was unpriced by every research report (master-spec cross-check):

1. PT-BR original course content (catalog rec C10).
2. Localized `failureMessage` (LX-C3 / `code.ts` `TestCase.failureMessage`).
3. Localized quiz feedback (`quiz.ts` option `feedback` / question `explanation`).
4. Localized `[TUTOR_NOTES]` for the AI Partner (`code.ts` `tutorNotes`).

The spec is explicit: **design once for all content — "never scope content-i18n
to one field"** (`code.ts:28`, master spec §3 LX-C3). The mechanism must serve
prose _and_ structured fields, fall back to EN, and keep CI's byte-verification.

### Hard constraints, each derived from a real file

- **Lesson ids are PDA-seed-stable and MUST NOT change.** `slots.lock.json` maps
  `lessonId → slotIndex` (fixture `courses/template/slots.lock.json`), and
  `complete_lesson` flips one bit of the on-chain bitmap keyed by that slot
  (`lesson.ts:9-12`). `gate3-slots.ts` regenerates the lock from the merge-base
  and **errors** if any slot moved, was reused, or a lesson id is missing. A
  translation must be **incapable** of touching an id, slug, slot, block key, or
  block order — not merely discouraged.
- **On-chain invariance.** XP (`course.xpPerLesson`), `creator`, `trackId`,
  `trackLevel`, and reward fields are read into the Course PDA. Translations must
  never carry any of them. A translated string reaching the on-chain path is a
  design failure.
- **Byte-reproducible compile.** `compile-content.ts` fetches the tarball at the
  `content.lock` SHA, runs the **pure** `compileBundle`, writes
  `apps/web/src/content/generated/*.json`, and CI does `git diff --exit-code`.
  Output must stay a pure function of the input tree: stable key order, no
  wall-clock (`meta.compiledAt` = the locked commit's own date). Any i18n design
  must preserve this — and, ideally, must **not perturb the existing EN bundle
  bytes** so the golden/`project.golden.test.ts` suite and freshness guarantee
  hold unchanged.
- **content-lint gates run in courses-academy CI** (`packages/content-lint/`):
  gate1-schema, gate2-ids, gate3-slots, gate4-refs, gate5-orphans, gate5a-xp,
  gate6-executor, gate7-quiz, gate13a/bcd, gate19-skills, gate20-originality,
  gate21-version-currency. i18n adds authoring surface these gates never saw;
  parity/staleness need new checks.
- **Staged-vs-live visibility.** Content stages until an `apps/web/content.lock`
  SHA bump activates it (see memory: courses-academy content-PR workflow). A
  translation is just more input at a SHA — it inherits the same staging, so no
  separate visibility switch is needed, but a _partially_ translated course must
  render safely (EN fallback per leaf).
- **The C1–C5 authoring wave is in flight.** 99 lessons exist today
  (`generated/meta.json`). The mechanism must impose **zero rewrite** on the EN
  tree — translations land additively, later, per lesson.

### The translatable surface (structured, not just prose)

Enumerated against the real schema so nothing is missed:

| Where      | Fields                                                                       | File                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prose      | the markdown body                                                            | `<lesson>/*.md` via `prose` block `src` (`prose.ts`)                                                                                                                                                   |
| Quiz       | question `prompt`, question `explanation`, option `label`, option `feedback` | inline in `lesson.yaml` (`quiz.ts`)                                                                                                                                                                    |
| Code       | `hints[]`, `tutorNotes[]`                                                    | inline in `lesson.yaml` (`code.ts`)                                                                                                                                                                    |
| Code tests | per-case `description`, `failureMessage`                                     | `<lesson>/**/tests.json` (`code.ts` `TestCase`)                                                                                                                                                        |
| Lesson     | `title`                                                                      | `lesson.yaml` (`lesson.ts`)                                                                                                                                                                            |
| Course     | `title`, `description`, module `title` + `description`                       | `course.yaml` (`projector.ts:118-149`)                                                                                                                                                                 |
| Video      | `url` (optional dubbed/subbed variant)                                       | `lesson.yaml` (`video.ts`) — overlay-compatible (a `blocks.<key>.url` leaf in `l10n/<locale>.yaml`, same per-leaf EN fallback), but producing dubbed/subbed assets is out of scope for launch — see §8 |

**Never translated:** ids, slugs, `skills`, block `key`/order, code `starter`/
`solution`, `tests.json` `input`/`expectedOutput` (byte-compared), all XP/creator/
track fields, `openEnded` blocks (not authored at launch — attestation endpoint
absent, master spec §3).

---

## 2. Candidate mechanisms

All three keep the EN tree as the source of truth and add PT-BR (and any
`config.locales` entry) as an **overlay** — EN fallback is the default in every
one. They differ in _where translated strings live_ and _how staleness is caught_.

### Candidate A — co-located per-locale variants (sibling files + per-lesson overlay)

Translations live next to their EN source in the same lesson directory.

- **Prose:** a sibling `intro.pt-BR.md` beside `intro.md`. The prose block still
  reads `src: intro.md`; the compiler derives the locale variant by naming
  convention (`<basename>.<locale>.md`).
- **Structured fields:** one file per lesson per locale,
  `lessons/<dir>/l10n/pt-BR.yaml`, keyed by **stable field paths** (block key +
  field), never a mirror of block structure:

  ```yaml
  # lessons/basics/l10n/pt-BR.yaml
  basedOn: "sha256:…" # hash of the EN translatable-set (staleness pin)
  title: "Fundamentos"
  blocks:
    check: # block key
      q1: { prompt: "Quais contas armazenam estado?" }
      q1.options: { c: { feedback: "Entradas, não contas." } }
    challenge:
      hints: ["Comece pela struct da conta"]
      tutorNotes: ["Esquecer o discriminador é o erro comum"]
      tests: { case-1: { failureMessage: "Verifique o tamanho da conta" } }
  ```

- **Course/module strings:** `<course>/l10n/pt-BR.yaml` (title, description,
  module titles/descriptions).

**Authoring workflow:** translator copies `intro.md`→`intro.pt-BR.md`, adds a
`l10n/<locale>.yaml`, runs `pnpm content:l10n-sync` (new helper, mirrors
`pnpm content:slots`) to stamp `basedOn` hashes.
**compile-content changes:** `projectContent` (`projector.ts`) gains a locale
loop; `projectBlock` prose branch prefers `<src>.<locale>.md` when present;
inline fields merged from the `l10n` overlay by field path.
**Bundle shape:** see §4 (sparse per-locale overlay files, EN bundle untouched).
**Fallback:** per-leaf to EN (any missing key/file → EN string).
**Migration:** zero — EN tree untouched; add files per lesson over time.

### Candidate B — per-course locale subtree (mirrored overlay directory)

One overlay root per locale per course: `<course>/i18n/pt-BR/lessons/<dir>/…`
mirroring the EN lesson subtree, holding a **translatable-only subset** of
`lesson.yaml` plus the `.md` files.

- Keeps the EN tree pristine and gathers all of a locale's work in one folder
  (nice for a translator taking a whole course, and for a per-course "PT-BR
  complete" coverage read).
- **Risk:** a mirrored `lesson.yaml` subset re-declares block keys and structure,
  so it _can_ drift from EN (a renamed/removed block, a reordered option). Needs
  a strict "overlay may contain translatable leaves only — no ids, no slots, no
  block additions/removals/reorders" gate to regain the safety Candidate A gets
  structurally. More gate surface for the same guarantee.
- compile-content resolves the overlay subtree per locale; same bundle shape as A.
- Migration: zero on EN; higher per-lesson authoring overhead (mirror the tree).

### Candidate C — separate translation-overlay repo

A second repo (`courses-academy-i18n`) pinned by a second lock; `compile-content`
fetches both tarballs and merges by id + field path.

- **Pro:** decouples translation cadence from content cadence; translators never
  touch the content repo.
- **Con:** doubles the lock/CI surface and _worsens_ the core hard problem —
  staleness now spans two independently-moving SHAs, so "is this translation
  current with EN?" becomes a cross-repo diff. `gate3-slots` reads the _content_
  repo's history; a split repo can't see slot/id changes to validate against.
  Byte-repro now depends on two pinned SHAs staying coherent. Rejected as the
  launch mechanism (revisit only if translation is outsourced to a party that
  cannot get content-repo write access).

---

## 3. Staleness — the hard problem

When an EN lesson is edited and its PT-BR lags, the learner silently reads a
stale translation. The mechanism must **detect and surface** this, and it must
never _block_ an EN-only content PR (that would make every EN edit wait on a
translator — the exact anti-pattern gate 21 avoids for version pins).

**Design:** hash-pin per translated unit, borrowing the `versionStamp` +
`gate21-version-currency` pattern (`version-stamp.ts`, `gate21-version-currency.ts`).

- The compiler computes a canonical hash of each lesson's EN **translatable-set**
  (the concatenation, in stable order, of every EN leaf a translation covers:
  prose `.md` bytes + inline translatable strings). This is a pure function of
  the EN tree — no new authored data on the EN side.
- Each `l10n/<locale>.yaml` records `basedOn: sha256:…` — the EN hash the
  translation was last reconciled against, stamped by `pnpm content:l10n-sync`
  (authors never hand-write it, exactly as they never hand-write `slots.lock`).
- **New gate 22 — translation staleness**, tiered exactly like gate 21 (warning/
  notice, **never error**, degrades cleanly):
  - _warning_ — `basedOn` ≠ current EN hash for a lesson that has a translation
    (EN moved, translation lags). Actionable: re-translate the changed leaves and
    re-run `content:l10n-sync`.
  - _warning_ — a translation file references a block key / field path that no
    longer exists in EN (structural drift). Candidate A makes this rare (paths
    are the only structure); Candidate B makes it common.
  - _notice_ — coverage report per course per locale (translated leaves / total),
    so the owner can see "Zero-to-Deployed is 100% PT-BR, C4 is 40%".
- Granularity: **per-lesson hash** for launch (a change to any EN leaf marks the
  whole lesson stale — coarse but simple, matches `versionStamp`'s whole-lesson
  grain). Per-leaf hashing is a later refinement if re-translation churn hurts.

Candidate C cannot use this cleanly — the EN hash and the translation live in
different repos at different SHAs, so `basedOn` compares across a moving target.

---

## 4. Bundle shape and size

**Keep the EN bundle bytes identical; emit sparse per-locale overlay files.**

- `generated/lessons.json` (and `courses.json`) stay **exactly as today** — EN
  only, same shape, same bytes. This preserves `project.golden.test.ts` and the
  `git diff --exit-code` freshness guarantee for the EN path unchanged, and means
  the 99 existing lessons' bundle output does not move.
- The compiler additionally emits `generated/lessons.pt-BR.json` (and
  `courses.pt-BR.json`) containing **only translated leaves**, keyed by
  `lessonId → { blockKey.field: value, "src:<blockKey>": "<md>" }`. Sparse: an
  untranslated lesson contributes nothing; an untranslated field is absent.
- `store.ts` value-imports the default bundle plus any per-locale overlay files
  (server-only, unchanged security posture). `project.ts` / `queries.ts` apply
  the overlay for the requested locale (from `next-intl`'s `requestLocale`,
  `lib/i18n/request.ts`) at projection time, falling back to the EN leaf when the
  overlay lacks a key. **All merge logic lives in one place** (`project.ts`),
  mirroring how the SP2 flip already localized shape there.

**Size impact:** additive and proportional to translated volume, not to locale
count × full catalog. A fully-translated flagship (≈52 lessons) adds roughly one
more `lessons.json`-worth of _prose+strings only_ (no duplicated code/tests/
solutions — those never translate), i.e. materially less than the EN bundle. The
serverless bundle only loads overlays for configured locales; unconfigured
locales cost nothing.

**Renderer:** no component change — `project.ts` returns the same `Lesson` /
`LessonBlock` (`@superteam-lms/types`) shape it does today, already localized.
The block renderer and `OutputPanel` never learn about locales.

---

## 5. CI cost, gates, and migration

- **CI cost:** `compile-content` now projects N locales; the added work is string
  merges + N-1 sparse bundle writes (cheap — the tarball fetch, Zod validation,
  and executor gate are unchanged and locale-independent). `git diff --exit-code`
  extends to the new overlay files automatically.
- **New gates:** (a) **gate 22 staleness/parity** (§3, warning/notice only);
  (b) a **schema gate** that an `l10n/<locale>.yaml` (Candidate A) or overlay
  subtree (Candidate B) contains **only** translatable leaf strings at known
  paths — **error** if it carries an id, slug, slot, XP, `correct` flag, block
  key not in EN, or any non-translatable field. This is the structural guard that
  makes "translations can't touch the on-chain surface" a _checked_ invariant,
  not a convention. Candidate A needs the smaller version of this gate; Candidate
  B needs the larger one.
- **Existing gates:** gate3-slots, gate5a-xp, gate2-ids are unaffected — they run
  on the EN tree, which the overlay never modifies. gate7-quiz should be extended
  to validate translated quiz text shape (non-empty), but option `correct` flags
  are read only from EN.
- **Migration for the 99 existing lessons:** none. The EN tree and its compiled
  bytes do not change. Translations are added file-by-file; a course with zero
  overlay files behaves exactly as today (pure EN).

---

## 6. Recommendation

**Adopt Candidate A** (co-located sibling `.md` + per-lesson `l10n/<locale>.yaml`
keyed by field path), with the **sparse per-locale overlay bundle** (§4) and the
**hash-pinned, warning-only staleness gate** (§3). Reasons:

1. Prose stays a natural markdown file (translators edit prose as prose), while
   structured fields get a compact, path-keyed overlay — one mechanism, both
   surfaces, matching the "never scope to one field" mandate.
2. It makes the on-chain-invariance and id-stability guarantees **structural**:
   an `l10n` file has no place to put an id, slot, or XP value, so the smallest
   possible gate enforces safety. Candidate B needs a bigger gate to reach the
   same guarantee; Candidate C can't reach it cleanly at all.
3. EN bundle bytes are untouched → the byte-repro guarantee, golden tests, and
   the 99-lesson catalog are undisturbed; PT-BR is purely additive.
4. Staleness reuses a shipped, proven pattern (`versionStamp` + gate 21 tiering
   and `pnpm content:slots`-style stamping), so it's low-novelty to build and
   familiar to authors.

### Costed rollout

- **Pre-launch (with the mechanism, EN still ships first):** land schema +
  compiler + overlay-bundle + gate 22 + `content:l10n-sync`. Ship **EN-only**
  content — the mechanism exists but no translated content is required to launch
  (master spec: "everything ships EN-first until then"). Size: the **L** the
  spec already priced.
- **Timing vs fast-follow courses (LX-D3/D4/D7):** land the _mechanism_ **before
  or alongside** the fast-follow authoring so PT-BR can be written next to EN
  from day one rather than retrofitted. Actual PT-BR _translation_ of the
  flagship spine is a **post-launch** content effort (translator time, not eng
  time), gated by the owner's quality policy (D-5 item 6).
- **First translated target:** the Zero-to-Deployed flagship spine, then the
  highest-failure `failureMessage`/`tutorNotes` (UIUX experiment #7), which are
  the cheapest high-leverage leaves.

---

## 7. The D-5 decision list (for the owner)

Each item states the options and the recommended pick.

1. **Mechanism.** (a) co-located sibling `.md` + per-lesson `l10n` overlay
   [**recommended**]; (b) per-course mirrored `i18n/<locale>/` subtree — cleaner
   folder-per-translator but needs a heavier structural gate; (c) separate
   translation repo — only if translation is outsourced without content-repo
   access (worsens staleness, rejected for launch).
2. **Bundle shape.** (a) sparse per-locale overlay files, EN bundle byte-identical
   [**recommended**]; (b) inline `{ locale: string }` maps in the single bundle —
   simpler read path but perturbs every EN string, churns the EN bundle bytes,
   and breaks the "EN untouched" golden guarantee.
3. **Staleness policy.** (a) hash-pin + **warning-only** gate 22 (EN edits never
   blocked) [**recommended**]; (b) hard-error gate (EN edit blocked until PT-BR
   catches up) — safer freshness, but couples every EN PR to translator
   availability; (c) none — silent stale translations (rejected).
4. **Timing.** Land the **mechanism** before/alongside the fast-follow courses so
   PT-BR is authored beside EN [**recommended**]; PT-BR **translation content**
   is post-launch. Alternative: defer the whole mechanism until after fast-follow
   (delays the moat, forces retrofit translation later).
5. **Launch locale scope.** `config.locales` already lists `pt-BR` and `es`.
   Recommend building locale-generic but **committing translator effort to
   `pt-BR` only** at launch (the moat); `es` rides the same mechanism later.
   Owner: pt-BR only, or pt-BR + es?
6. **AI-translation-quality policy** — _owner's call, deliberately not designed
   here_ (master spec forbids this doc taking a position). Options: human-only
   translation; machine-translation seed **with** mandatory human review; or a
   later per-course quality bar. This gates _when_ PT-BR content is advertised as
   the "original, non-stale" moat, so it must be answered before promotion.
7. **Coverage threshold for promotion.** Should a course be advertised as
   "available in PT-BR" only above a coverage % (gate 22 reports it), or is
   any-amount-with-EN-fallback enough? Recommend a threshold (e.g. 100% of the
   flagship spine) before marketing it as localized, but ship partial silently
   with fallback.

---

## 8. Explicitly out of scope

- **Dubbed/subtitled video production.** The overlay mechanism can carry a
  per-locale `url` leaf the moment an asset exists (no schema change), but
  commissioning, hosting, and QA of localized video is a content-production
  effort, not part of this mechanism, and is not required for the PT-BR text
  moat.

- **Slug localization / locale-prefixed content URLs.** Slugs stay EN and
  id-stable; localized slugs are an SEO nicety for a later issue, not the moat.
- **AI-translation quality / provider choice** — D-5 item 6, owner's decision.
- **Localizing the AI Partner's _runtime_ conversation** (as opposed to the
  authored `tutorNotes` inputs) — separate concern (AI-tutor economics spec).
- **RTL or non-Latin locales** — `config.locales` is pt-BR/es/en; no RTL work.
- **Translating code** (`starter`/`solution`/test `input`/`expectedOutput`) —
  never; only surrounding prose/hints/messages localize.
- **Migrating the 99 existing lessons** — there is nothing to migrate; the EN
  tree is untouched and translations are additive.
- **Runtime/user-facing locale switching UX** beyond what `next-intl` already
  provides — this doc covers the content pipeline, not the locale-picker UI.
- **Implementation** — this is a design; the build lands in a follow-up issue
  after the owner resolves D-5.
