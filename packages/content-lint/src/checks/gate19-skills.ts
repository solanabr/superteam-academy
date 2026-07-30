import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  SkillsTaxonomy,
  NON_REVIEW_ELIGIBLE_SKILLS,
  REVIEW_INTERLEAVING_PAIRS,
  type SkillsTaxonomyT,
} from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/**
 * Gate 19 — skill-tag vocabulary (unified launch spec 2026-07-25 §3 item 7,
 * PB-5). Numbered after §6.2's reserved 1–18 (8–15 are the quest/achievement
 * and governance gates; 16–18 run at sync time). Four sub-gates:
 *
 *  19a (error)   every lesson `skills:` slug resolves to the repo-root
 *                `skills.yaml` registry. This is the check that today only
 *                runs at SYNC time (`checkSkillVocabulary`) — an invented
 *                slug must fail the content PR, not the sync.
 *  19b (warning) minimum reuse bar: every registry slug applied to at least
 *                one lesson should be applied to ≥2, except slugs marked
 *                `reviewExempt: true` in `skills.yaml` (single-use by design,
 *                catalog spec §5 policy 4 — e.g. `brazil-compliance`,
 *                `earn-submission`), which emit nothing. A registry slug applied
 *                to NO lesson is also a warning (dead vocabulary entry).
 *                WARNING tier for now — the reuse bar guards the Wave 3 review
 *                queue. The 5-course catalog has landed, but the paired
 *                skills.yaml sweep has not, so erroring today would redden
 *                content CI on main. Flip to error right after that sweep —
 *                see the TODO at the 19b loop (#676).
 *  19c (warning) interleaving-pair vocabulary: both members of each
 *                REVIEW_INTERLEAVING_PAIRS pair exist in `skills.yaml` and
 *                are applied to ≥2 lessons each. WARNING tier for now: the
 *                current 24-slug registry (and the staged 42-slug one) lacks
 *                6 of the 10 members, so an error tier would turn every
 *                content PR red on a gap only a vocabulary decision can fix.
 *                Upgrade to error once the pair vocabulary lands.
 *  19d (notice)  facet-only tags: registry slugs on NON_REVIEW_ELIGIBLE_SKILLS
 *                stay legal as catalog facets but are flagged so nobody keys a
 *                review set on them.
 */

const SKILLS_FILE = "skills.yaml";

/**
 * `courses/_template/**` holds scaffolding, not shippable content. Its lessons
 * are excluded from gate 19 so a template tag never contributes to (or hides) a
 * reuse-bar result — e.g. a template lesson sharing a real slug would otherwise
 * lift that slug's count from 1 to 2 and suppress a legitimate singleton error.
 * Scoped to gate 19 only; other gates keep their current view of `_template`.
 */
const TEMPLATE_LESSON_PREFIX = "courses/_template/";

function loadRegistry(root: string, out: Diagnostic[]): SkillsTaxonomyT | null {
  let text: string;
  try {
    text = readFileSync(join(root, SKILLS_FILE), "utf8");
  } catch {
    out.push(
      diag(
        "gate-19a",
        "error",
        SKILLS_FILE,
        "skills.yaml not found at the repo root — every lesson `skills:` slug must resolve to the canonical vocabulary"
      )
    );
    return null;
  }
  let data: unknown;
  try {
    data = parseYaml(text, { version: "1.2" });
  } catch (err) {
    out.push(
      diag(
        "gate-19a",
        "error",
        SKILLS_FILE,
        `failed to parse: ${err instanceof Error ? err.message : String(err)}`
      )
    );
    return null;
  }
  // An empty or whitespace-only file parses to null/undefined — a distinct,
  // actionable failure from a mis-shaped (e.g. object) document below.
  if (data == null) {
    out.push(
      diag(
        "gate-19a",
        "error",
        SKILLS_FILE,
        "skills.yaml is empty — expected a non-empty list of skill definitions"
      )
    );
    return null;
  }
  const parsed = SkillsTaxonomy.safeParse(data);
  if (!parsed.success) {
    out.push(
      diag(
        "gate-19a",
        "error",
        SKILLS_FILE,
        `not a valid skills taxonomy: ${parsed.error.issues
          .map(
            (i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`
          )
          .join("; ")}`
      )
    );
    return null;
  }
  return parsed.data;
}

export function gate19Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  // An empty tree (no lessons at all) has nothing to resolve; a real content
  // repo always has lessons, and every lesson requires non-empty `skills`.
  if (model.lessons.length === 0) return out;

  const registry = loadRegistry(model.root, out);
  if (!registry) return out;
  const known = new Set(registry.map((s) => s.slug));

  // Distinct-lesson count per slug (a slug repeated within one lesson counts once).
  const lessonsBySlug = new Map<string, string[]>();
  for (const entry of model.lessons) {
    if (entry.file.startsWith(TEMPLATE_LESSON_PREFIX)) continue;
    for (const slug of new Set(entry.lesson.skills)) {
      // 19a — registry resolution.
      if (!known.has(slug)) {
        out.push(
          diag(
            "gate-19a",
            "error",
            entry.file,
            `skill "${slug}" is not in the skills.yaml vocabulary`
          )
        );
        continue;
      }
      const files = lessonsBySlug.get(slug) ?? [];
      files.push(entry.file);
      lessonsBySlug.set(slug, files);
    }
  }

  // 19b — minimum reuse bar over the registry.
  //
  // TODO(#676): flip the single-lesson case below from `warning` to `error`.
  // The bar exists to guard the Wave 3 spaced-review queue — a slug behind one
  // lesson can only re-serve that lesson, never generate a genuine review item.
  //
  // The catalog precondition is now MET: C1–C5 all exist (courses-academy main
  // c5c625e, 2026-07-30). The remaining blocker is the *sweep* the flip issue
  // pairs with the tier change, and it lands in the CONTENT repo, not here — an
  // audit of that commit still reports 30 gate-19b findings (23 single-use
  // slugs, 7 dead vocabulary entries), so flipping the tier in isolation would
  // redden content CI on main. Order of operations: land the skills.yaml sweep
  // in courses-academy (`reviewExempt: true` for the by-design singletons, a
  // second lesson or consolidation for the rest, delete the dead entries), then
  // flip this tier. Warning tier surfaces every under-applied slug honestly on
  // each run in the meantime; `reviewExempt` already silences the by-design
  // singletons, which is what makes the eventual flip clean.
  for (const entry of registry) {
    const { slug } = entry;
    const uses = lessonsBySlug.get(slug) ?? [];
    if (uses.length === 0) {
      out.push(
        diag(
          "gate-19b",
          "warning",
          SKILLS_FILE,
          `skill "${slug}" is in skills.yaml but applied to no lesson (dead vocabulary entry)`
        )
      );
    } else if (uses.length === 1) {
      // A slug marked `reviewExempt: true` is single-use by design (catalog
      // spec §5 policy 4) — no diagnostic at all. Every other single-lesson
      // slug warns (see the TODO above for why this is not yet an error).
      if (entry.reviewExempt) continue;
      out.push(
        diag(
          "gate-19b",
          "warning",
          SKILLS_FILE,
          `skill "${slug}" is applied to only 1 lesson (${uses[0]}) — the minimum reuse bar is 2; tag a second lesson, drop the slug, or mark it "reviewExempt: true" in skills.yaml if it is single-use by design. Becomes an error once the skills.yaml sweep lands (#676)`
        )
      );
    }
  }

  // 19c — interleaving-pair vocabulary (WARNING tier, see header).
  for (const [a, b] of REVIEW_INTERLEAVING_PAIRS) {
    for (const member of [a, b]) {
      const label = `interleaving pair ${a} ↔ ${b}`;
      if (!known.has(member)) {
        out.push(
          diag(
            "gate-19c",
            "warning",
            SKILLS_FILE,
            `skill "${member}" (${label}) is missing from skills.yaml — Wave 3 review sets cannot be built without it (unified launch spec §3 item 7)`
          )
        );
      } else if ((lessonsBySlug.get(member) ?? []).length < 2) {
        out.push(
          diag(
            "gate-19c",
            "warning",
            SKILLS_FILE,
            `skill "${member}" (${label}) is applied to ${
              (lessonsBySlug.get(member) ?? []).length
            } lesson(s) — interleaving needs ≥2 each (unified launch spec §3 item 7)`
          )
        );
      }
    }
  }

  // 19d — facet-only tags: legal on lessons, never review keys.
  for (const facet of NON_REVIEW_ELIGIBLE_SKILLS) {
    if (known.has(facet)) {
      out.push(
        diag(
          "gate-19d",
          "notice",
          SKILLS_FILE,
          `skill "${facet}" is a catalog facet only — not review-eligible; review sets must not key on it (NON_REVIEW_ELIGIBLE_SKILLS)`
        )
      );
    }
  }

  return out;
}

registerCheck(gate19Check);
