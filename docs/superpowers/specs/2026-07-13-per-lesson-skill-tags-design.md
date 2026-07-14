# Per-lesson skill tags → a meaningful Skills radar

**Status:** design — no code. Post-launch; off the WS-1 critical path.
**Motivation:** the profile Skills radar is currently cosmetic. Fix it by moving the tag model from per-course to per-lesson.

---

## 1. The problem

The profile "Skills" radar is driven by `course.tags[]`. For each course, its completed-lesson **count** is added to **every** tag the course carries, then normalised so the strongest tag = 100 (`apps/web/src/app/[locale]/(platform)/profile/page.tsx:231-254`, and its public twin `profile/[username]/page.tsx`).

Two consequences make it noise:

- **It restates "which courses you did," not what you learned.** Every tag on a course gets the identical increment, so a course's tags are mathematically indistinguishable — they move in lockstep. A learner who did only the PDA lessons of a course gets the same skill shape as one who did only the token lessons.
- **A single-course learner maxes every axis.** All that course's tags tie → all normalise to 100 → a fully-maxed regular polygon. That is exactly the "flat 100% everywhere" the code comment (`profile/page.tsx:230`) claims to avoid; it only avoids it once you've done unequal amounts across differently-tagged courses.
- **Difficulty leaks in.** `beginner`/`intermediate`/`advanced` sit in the same `tags[]` array as real skills, so "intermediate" renders as a *competency* on the radar.

Goal: lessons carry their own skill tags, so the radar reflects the actual content a learner completed, and difficulty stops being a skill.

---

## 2. Ownership: content repo owns the data, monorepo owns the machinery

This is cross-repo, and the split is the spine of the design.

| Lives in **`solanabr/courses-academy`** (content, author-owned) | Lives in **`superteam-academy`** (monorepo, machinery) |
| --- | --- |
| `skills` on every lesson (`lesson.yaml`) | the `skills` field *definition* + shape (`content-schema`) |
| `difficulty` on every course (`course.yaml`) | the `difficulty` field definition |
| **the canonical skills vocabulary** (`skills.yaml`) | the compiler that reads the vocab, validates lessons against it, derives course chips |
| | the radar computation + the lint hygiene rule |

**Why the vocabulary lives in content, not the schema.** The controlled vocabulary is a content concern: adding or renaming a skill should be a **content PR in the same repo as the lessons using it**, never a monorepo release. So the canonical list is `skills.yaml` in `courses-academy`, pinned with everything else through `content.lock`. The monorepo defines the *shape* of that file and enforces membership at compile time; it does not own the values.

**Why it can't be content-only.** A field the schema and compiler don't know about is silently stripped — Zod `.parse` drops unknown keys (the same trap as the WS-1 reward-field removal). The field must be taught to `content-schema` and the compiler before any lesson can carry it.

---

## 3. Schema changes (`packages/content-schema`)

### 3.1 New: the skills-taxonomy shape — `src/skills.ts`

Defines the *shape* of `courses-academy`'s `skills.yaml`, not its contents:

```ts
export const Skill = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), // kebab-case
  label: z.string().min(1),                              // radar axis + chip label
});
export const SkillsTaxonomy = z.array(Skill)
  .refine((xs) => unique(xs.map((s) => s.slug)), { message: "skill slugs must be unique" });
export type SkillSlug = string; // validated dynamically against the taxonomy (§4.2)
```

`slug` is the identifier lessons reference; `label` is the human-facing string on the radar axis and the course chip (so display is authored, not derived from the slug).

### 3.2 `lesson.ts` — add `skills`

```ts
skills: z.array(z.string().regex(SLUG_RE)).min(1),
```

Required, ≥ 1. A lesson cannot compile without at least one skill, which guarantees derived course chips are never bare. Membership in the vocabulary is enforced at compile time (§4.2), not by the static schema, because the vocabulary lives in content.

### 3.3 `course.ts` — drop authored `tags`, add `difficulty`

- **Remove** authored `tags` — it becomes a derived, compile-time field (§4.1), not something an author writes.
- **Add** `difficulty: z.enum(["beginner", "intermediate", "advanced"])`, its own field, one value per course. It never enters the tag union, so it can never reach the radar.

---

## 4. Compiler changes (`apps/web/scripts/compile-content.ts` + `src/lib/content/compile/`)

The content repo already ships YAML docs (`course.yaml`, `lesson.yaml`, `paths/*.yaml`, …) plus per-course `slots.lock.json`. Three additions:

### 4.1 Derive course `tags` from the union of lesson skills
`projector.ts:113` currently does `tags: c.tags ?? []`. It becomes the **sorted, unique union of the course's lessons' `skills`**. A pure, unit-testable function `deriveCourseTags(lessons): string[]`. The emitted `courses.json` keeps its `tags` field (same shape, now derived and clean) so `course-detail-client.tsx` chips and every other consumer are untouched; it gains a `difficulty` field for the new badge.

### 4.2 Load `skills.yaml` and cross-validate membership
Add a load branch for the top-level `skills.yaml` (alongside the existing `course.yaml`/`lesson.yaml` branches at `compile-content.ts:122-143`). Then, after parsing, assert **every `lesson.skills` slug exists in the taxonomy**. An unknown slug **fails the build** with the offending lesson id and slug — this is the "controlled vocabulary, enforced" guarantee, sourced from content. This replaces what a hardcoded Zod enum would have done, but keeps the values in the content repo.

### 4.3 Emit `difficulty`
Thread `course.difficulty` through the projector onto the compiled course object.

---

## 5. Radar changes (`profile/page.tsx` + `profile/[username]/page.tsx`)

The radar becomes per-lesson. No new table or migration — `user_progress` already holds one row per completed lesson.

1. **Query:** the completion fetch (`profile/page.tsx:118-122`) selects `course_id, completed`; add **`lesson_id`**.
2. **Attribution:** for each completed `lesson_id`, look up its `skills` from the bundle (a `lessonId → skills` map exposed from `lib/content`), and tally **+1 per skill**.
3. **Normalise:** unchanged — strongest skill = 100, others proportional. With real per-lesson tags this now yields a genuine distribution.
4. Difficulty never appears (separate field). Axis labels come from the taxonomy's `label`.

The tally is a pure function `radarFromCompletedLessons(completedLessonIds, lessonSkillMap): SkillItem[]`, testable without the DB. Both profile pages call it; factor it into `lib/` so the two pages don't drift (they currently hand-duplicate the radar logic).

---

## 6. Lint (`packages/content-lint`)

The compiler already hard-fails on an unknown or empty skill (§4.2, §3.2). Lint adds only **hygiene**, non-blocking:

- **Dead vocabulary:** warn on a `skills.yaml` entry that no lesson uses.
- **Optional — thin axis:** warn on a skill used by exactly one lesson (it will always be a lone spike on the radar; may be intended, hence a warning, not an error).

No new hard rules — validity is the compiler's job.

---

## 7. The vocabulary (proposed starter — the highest-leverage decision)

Granularity is what makes or breaks the radar: too broad → course-shaped again; too fine → every lesson is its own spike. The target is skills that each span **multiple lessons across multiple courses**. Proposed first cut (~20), to be refined against the actual lesson content during backfill (§8):

```
solana-fundamentals, rust, anchor, pdas, cpi, spl-tokens, token-2022,
metaplex, program-security, program-testing, account-model,
defi, amm, lending, tokenomics,
typescript, react, nextjs, wallet-adapter, web3-frontend,
blockchain-fundamentals
```

This list is **provisional** and expected to shift as the AI-draft backfill (§8) surfaces what the content actually teaches. It is the single thing most worth a human eye — it defines every axis the product will ever show.

---

## 8. Backfill (`courses-academy` content PR)

The 76 existing lessons and 6 courses need values, or derived chips go bare and the radar undercounts.

- **Skills:** AI-drafted per lesson, from its `title` + block content, mapped to the vocabulary — delivered as a `courses-academy` PR. **Human review is mandatory**, not optional: an un-reviewed AI tag set produces plausible-but-wrong axes, which is just a different flavour of the noise we are removing. The draft and the vocabulary co-evolve — tagging the real content is what validates §7.
- **Difficulty:** extract each course's existing `beginner`/`intermediate`/`advanced` from its old `tags` into the new `difficulty` field (6 values).
- **Remove** the authored `tags` from the 6 `course.yaml` docs.

---

## 9. Sequencing (cross-repo — respects the Zod-strips-unknown-keys trap)

Order matters: a content key the schema does not yet know is silently dropped, and a required field the content does not yet have breaks the compile gate.

1. **Monorepo PR** — `content-schema`: add `skills.ts` (taxonomy shape), add `lesson.skills` as **optional**, add `course.difficulty`, keep tolerating authored `course.tags`. Add the `skills.yaml` load branch to the compiler but do **not** yet enforce membership or derive chips. (Behaviour-neutral: no content has skills yet.)
2. **Content PR** — `courses-academy`: add `skills.yaml`; add `skills` to all 76 lessons; add `difficulty` to the 6 courses; remove authored `course.tags`. (AI-draft + human review.)
3. **Monorepo PR** — `content-schema` + compiler: tighten `lesson.skills` to **required (min 1)**, **remove** authored `course.tags` from the schema, turn on membership validation (§4.2) and the derive-union (§4.1).
4. **Monorepo PR** — bump `content.lock` to the content SHA, recompile the bundle (byte-identical CI check), and switch the radar to per-lesson attribution (§5). Ship.

Steps 3 and 4 can be one PR if the content SHA is ready — the split exists only so the schema never requires a field the pinned content lacks.

---

## 10. Testing

- `deriveCourseTags(lessons)` — union is sorted, unique, empty-safe (though min-1 makes empty unreachable).
- membership validation — a lesson with an unknown slug fails the build with a clear message.
- `radarFromCompletedLessons(ids, map)` — attribution and normalisation; the single-course case now yields a *shaped* radar, not a maxed polygon.
- compile golden test — the recompiled bundle's course `tags` equal the expected unions; `difficulty` is present.

---

## 11. Non-goals

- **Not** a filtering/search/recommendation system — `skills` powers the radar and the course chips; anything else is later scope.
- **Not** per-lesson difficulty — difficulty is a whole-course property (decided).
- **Not** a change to XP, on-chain state, or the lesson bitmap — this is content-metadata + presentation only. No program, no Supabase migration.
- **Not** author-overridable course tags — course chips are purely the derived union (decided; revisit only if authors need a manual chip the skills don't cover).

---

## 12. Open questions for review

1. **The vocabulary (§7)** — granularity and membership. The one decision that defines every radar axis. Best reviewed against the AI-draft once lessons are tagged.
2. **Thin-axis lint (§6)** — warn on single-lesson skills, or leave it silent?
