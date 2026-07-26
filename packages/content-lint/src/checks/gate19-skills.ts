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
 *  19b (error)   minimum reuse bar: every registry slug applied to at least
 *                one lesson is applied to ≥2, except the allowed singletons
 *                (`brazil-compliance`, `earn-submission`). A registry slug
 *                applied to NO lesson is a warning (dead vocabulary entry).
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

/** Registry slugs allowed to be applied to exactly one lesson. */
export const ALLOWED_SINGLETON_SKILLS: readonly string[] = [
  "brazil-compliance",
  "earn-submission",
];

const SKILLS_FILE = "skills.yaml";

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
  for (const { slug } of registry) {
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
    } else if (uses.length === 1 && !ALLOWED_SINGLETON_SKILLS.includes(slug)) {
      out.push(
        diag(
          "gate-19b",
          "error",
          SKILLS_FILE,
          `skill "${slug}" is applied to only 1 lesson (${uses[0]}) — the minimum reuse bar is 2; tag a second lesson or drop the slug`
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
