#!/usr/bin/env tsx
/**
 * content-release-body.ts — the body of the release PR that
 * `.github/workflows/content-release.yml` opens or updates.
 *
 *   tsx scripts/content-release-body.ts --before <dir> --compare <file>
 *
 * `--before` is a copy of src/content/generated taken before the compile;
 * the compiled bundle is read from src/content/generated. `--compare` is the
 * GitHub compare of the two academy-courses commits (old...new). Markdown goes
 * to stdout.
 *
 * Which courses changed, and whose slot set moved, are read off the two
 * bundles rather than the compare's file list: GitHub caps that list at 300
 * files and returns none for a rollback, and the slot line is the one a
 * reviewer must not miss.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  contentCommitUrl,
  contentCompareUrl,
  contentTreeUrl,
  shortSha,
} from "../src/lib/github/publish-pin";

/** The fields this script reads off a GitHub compare response. */
export interface Compare {
  status: string;
  behind_by: number;
  total_commits: number;
  commits: { sha: string; commit: { message: string } }[];
}

interface Doc {
  _id: string;
  [field: string]: unknown;
}

interface BundleCourse extends Doc {
  slug: { current: string };
  modules?: { lessons?: { _ref: string }[] }[];
}

/** The parts of a compiled bundle a release touches, plus the pin it came from. */
export interface Bundle {
  sha: string;
  courses: BundleCourse[];
  lessons: Doc[];
  l10n: Record<string, unknown>;
  slots: Record<string, unknown>;
}

export interface CourseChange {
  slug: string;
  kind: "new" | "changed" | "removed";
  slotsChanged: boolean;
}

const MAX_COMMITS = 50;

export function readBundle(dir: string): Bundle {
  const read = (name: string): unknown =>
    JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
  return {
    sha: (read("meta") as { sha: string }).sha,
    courses: read("courses") as BundleCourse[],
    lessons: read("lessons") as Doc[],
    l10n: read("l10n") as Record<string, unknown>,
    slots: read("slots") as Record<string, unknown>,
  };
}

/** Everything a course ships — its doc, lessons, overlays and slot lock — as one string. */
function fingerprint(bundle: Bundle, courseId: string): string | null {
  const course = bundle.courses.find((c) => c._id === courseId);
  if (!course) return null;
  const lessons = new Map(bundle.lessons.map((l) => [l._id, l]));
  const lessonIds = (course.modules ?? []).flatMap((m) =>
    (m.lessons ?? []).map((ref) => ref._ref)
  );
  return JSON.stringify([
    course,
    lessonIds.map((id) => lessons.get(id) ?? null),
    bundle.l10n[courseId] ?? null,
    bundle.slots[courseId] ?? null,
  ]);
}

/** The courses whose shipped content differs between two bundles, by slug. */
export function diffCourses(before: Bundle, after: Bundle): CourseChange[] {
  const docs = new Map(
    [...before.courses, ...after.courses].map((c) => [c._id, c])
  );
  const changes: CourseChange[] = [];
  for (const [id, doc] of docs) {
    const was = fingerprint(before, id);
    const is = fingerprint(after, id);
    if (was === is) continue;
    changes.push({
      slug: doc.slug.current,
      kind: was === null ? "new" : is === null ? "removed" : "changed",
      slotsChanged:
        is !== null &&
        JSON.stringify(before.slots[id] ?? null) !==
          JSON.stringify(after.slots[id]),
    });
  }
  return changes.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * A commit subject as a code span, so it renders verbatim: no markdown, no
 * @-mentions, and no `#77` autolinking to this repo's #77 instead of
 * academy-courses'.
 */
export function inert(text: string): string {
  return `\`${text.replace(/`/g, "'")}\``;
}

export function buildReleaseBody(
  before: Bundle,
  after: Bundle,
  compare: Compare
): string {
  const pin = (sha: string) => `[\`${shortSha(sha)}\`](${contentTreeUrl(sha)})`;
  const out = [
    `Moves \`apps/web/content.lock\` from academy-courses ${pin(before.sha)} ` +
      `to ${pin(after.sha)} and recompiles the bundle ` +
      `([compare](${contentCompareUrl(before.sha, after.sha)})).`,
    "",
  ];

  if (compare.status === "behind") {
    out.push(
      `This rolls content back: the pin moves back ${compare.behind_by} commit(s).`,
      ""
    );
  } else {
    const shown = compare.commits.slice(0, MAX_COMMITS);
    for (const { sha, commit } of shown) {
      const subject = commit.message.split("\n")[0]!;
      out.push(
        `- ${inert(subject)} ([\`${shortSha(sha)}\`](${contentCommitUrl(sha)}))`
      );
    }
    const more = compare.total_commits - shown.length;
    if (more > 0) out.push(`- and ${more} more`);
    out.push("");
  }

  const courses = diffCourses(before, after);
  out.push(
    courses.length === 0
      ? "No course content changed."
      : `Courses changed: ${courses
          .map(
            (c) => `\`${c.slug}\`${c.kind === "changed" ? "" : ` (${c.kind})`}`
          )
          .join(", ")}.`,
    ""
  );

  const deploy = courses.filter((c) => c.slotsChanged);
  if (deploy.length > 0) {
    out.push("> [!IMPORTANT]");
    for (const { slug } of deploy) {
      out.push(
        `> - slot set changed — after merge, run Deploy for \`${slug}\` in /admin/courses`
      );
    }
    out.push("");
  }

  out.push(
    "Opened by the Content release workflow, which force-pushes this branch on every release. Don't commit to it."
  );
  return `${out.join("\n")}\n`;
}

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i === -1 ? undefined : process.argv[i + 1];
  if (!value) throw new Error(`missing --${name}`);
  return value;
}

function main(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const before = readBundle(arg("before"));
  const after = readBundle(path.resolve(here, "../src/content/generated"));
  const compare = JSON.parse(
    fs.readFileSync(arg("compare"), "utf8")
  ) as Compare;
  process.stdout.write(buildReleaseBody(before, after, compare));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
