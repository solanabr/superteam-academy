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
 * What changed is read off the two bundles rather than the compare's file
 * list: GitHub caps that list at 300 files and returns none for a rollback,
 * and the on-chain callouts are the lines a reviewer must not miss. They come
 * first, before any text taken from content, and every content-derived string
 * is rendered inert.
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
  achievements: Doc[];
  quests: Doc[];
  paths: Doc[];
  l10n: Record<string, unknown>;
  slots: Record<string, unknown>;
}

type Kind = "new" | "changed" | "removed";

export interface DocChange {
  id: string;
  kind: Kind;
}

export interface CourseChange {
  slug: string;
  kind: Kind;
  slotsChanged: boolean;
  creatorChanged: boolean;
  /** Other fields `create_course` writes once (lib/admin/sync-diff.ts). */
  immutableChanged: string[];
  /** Fields `update_course` rewrites on Deploy. */
  deployChanged: string[];
}

const IMMUTABLE_FIELDS = [
  "difficulty",
  "trackId",
  "trackLevel",
  "prerequisiteCourse",
];
const DEPLOY_FIELDS = ["xpPerLesson", "creatorRewardXp"];

const MAX_COMMITS = 50;
const MAX_SUBJECT = 200;
/** GitHub rejects a PR body over 65,536 characters. */
export const MAX_BODY = 60_000;

export function readBundle(dir: string): Bundle {
  const read = (name: string): unknown =>
    JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
  return {
    sha: (read("meta") as { sha: string }).sha,
    courses: read("courses") as BundleCourse[],
    lessons: read("lessons") as Doc[],
    achievements: read("achievements") as Doc[],
    quests: read("quests") as Doc[],
    paths: read("paths") as Doc[],
    l10n: read("l10n") as Record<string, unknown>,
    slots: read("slots") as Record<string, unknown>,
  };
}

const json = (value: unknown) => JSON.stringify(value ?? null);

/** Everything a course ships — its doc, lessons, overlays and slot lock — as one string. */
function fingerprint(bundle: Bundle, courseId: string): string | null {
  const course = bundle.courses.find((c) => c._id === courseId);
  if (!course) return null;
  const lessons = new Map(bundle.lessons.map((l) => [l._id, l]));
  const lessonIds = (course.modules ?? []).flatMap((m) =>
    (m.lessons ?? []).map((ref) => ref._ref)
  );
  return json([
    course,
    lessonIds.map((id) => lessons.get(id) ?? null),
    bundle.l10n[courseId],
    bundle.slots[courseId],
  ]);
}

/** The courses whose shipped content differs between two bundles, by slug. */
export function diffCourses(before: Bundle, after: Bundle): CourseChange[] {
  const was = new Map(before.courses.map((c) => [c._id, c]));
  const is = new Map(after.courses.map((c) => [c._id, c]));
  const changes: CourseChange[] = [];
  for (const id of new Set([...was.keys(), ...is.keys()])) {
    if (fingerprint(before, id) === fingerprint(after, id)) continue;
    const old = was.get(id);
    const now = is.get(id);
    const differs = (fields: string[]) =>
      old && now ? fields.filter((f) => json(old[f]) !== json(now[f])) : [];
    changes.push({
      slug: (now ?? old)!.slug.current,
      kind: !old ? "new" : !now ? "removed" : "changed",
      slotsChanged:
        !!old && !!now && json(before.slots[id]) !== json(after.slots[id]),
      creatorChanged: differs(["creator"]).length > 0,
      immutableChanged: differs(IMMUTABLE_FIELDS),
      deployChanged: differs(DEPLOY_FIELDS),
    });
  }
  return changes.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Achievements, quests or paths whose doc differs between two bundles, by id. */
export function diffDocs(before: Doc[], after: Doc[]): DocChange[] {
  const was = new Map(before.map((d) => [d._id, json(d)]));
  const is = new Map(after.map((d) => [d._id, json(d)]));
  const changes: DocChange[] = [];
  for (const id of new Set([...was.keys(), ...is.keys()])) {
    if (was.get(id) === is.get(id)) continue;
    changes.push({
      id,
      kind: !was.has(id) ? "new" : !is.has(id) ? "removed" : "changed",
    });
  }
  return changes.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Content-derived text as a code span that renders verbatim: no markdown, no
 * HTML, no @-mention, no `#77` autolink or closing keyword. Control characters
 * become spaces first, because a bare `\r` is a CommonMark line ending that
 * would end the span and let the rest render live.
 */
export function inert(text: string, max = MAX_SUBJECT): string {
  // eslint-disable-next-line no-control-regex -- stripping them is the point
  const flat = [
    ...text.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " "),
  ];
  const capped =
    flat.length > max ? `${flat.slice(0, max - 1).join("")}…` : flat.join("");
  return `\`${capped.replace(/`/g, "'")}\``;
}

const IMMUTABLE_NOTE =
  "immutable on-chain once deployed; a deployed course would need a recreate";

function courseCallouts(c: CourseChange): string[] {
  const slug = inert(c.slug);
  if (c.kind === "new") {
    return [
      `${slug}: new course — after merge, run Deploy for it in /admin/courses to create it on-chain`,
    ];
  }
  if (c.kind === "removed") {
    return [
      `${slug}: removed — if it was deployed, its pages, lesson completions and credential mint stop working and it drops out of /admin/courses, so deactivate it there before merging`,
    ];
  }
  const out: string[] = [];
  if (c.slotsChanged) {
    out.push(
      `slot set changed — after merge, run Deploy for ${slug} in /admin/courses`
    );
  }
  if (c.creatorChanged) {
    out.push(`${slug}: creator wallet changed — ${IMMUTABLE_NOTE}`);
  }
  if (c.immutableChanged.length > 0) {
    out.push(
      `${slug}: ${c.immutableChanged.join(", ")} changed — ${IMMUTABLE_NOTE}`
    );
  }
  if (c.deployChanged.length > 0) {
    out.push(
      `${slug}: ${c.deployChanged.join(", ")} changed — reaches the chain only on Deploy`
    );
  }
  return out;
}

function changeList(label: string, changes: DocChange[]): string {
  const items = changes.map(
    ({ id, kind }) => `${inert(id)}${kind === "changed" ? "" : ` (${kind})`}`
  );
  return `${label} changed: ${items.join(", ")}.`;
}

export function buildReleaseBody(
  before: Bundle,
  after: Bundle,
  compare: Compare
): string {
  const pin = (sha: string) => `[\`${shortSha(sha)}\`](${contentTreeUrl(sha)})`;
  const head = [
    `Moves \`apps/web/content.lock\` from academy-courses ${pin(before.sha)} ` +
      `to ${pin(after.sha)} and recompiles the bundle ` +
      `([compare](${contentCompareUrl(before.sha, after.sha)})).`,
    "",
  ];
  if (compare.status === "behind") {
    head.push(
      `This rolls content back: the pin moves back ${compare.behind_by} commit(s).`,
      ""
    );
  }

  const courses = diffCourses(before, after);
  const achievements = diffDocs(before.achievements, after.achievements);
  const quests = diffDocs(before.quests, after.quests);
  const paths = diffDocs(before.paths, after.paths);

  const callouts = [
    ...courses.flatMap(courseCallouts),
    ...achievements
      .filter((a) => a.kind === "new")
      .map(
        (a) =>
          `${inert(a.id)}: new achievement — run Deploy for it in /admin/courses before it can be awarded`
      ),
  ];
  if (callouts.length > 0) {
    head.push("> [!IMPORTANT]", ...callouts.map((c) => `> - ${c}`), "");
  }

  const summary = (
    [
      ["Courses", courses.map((c) => ({ id: c.slug, kind: c.kind }))],
      ["Achievements", achievements],
      ["Quests", quests],
      ["Paths", paths],
    ] as const
  )
    .filter(([, changes]) => changes.length > 0)
    .flatMap(([label, changes]) => [changeList(label, changes), ""]);
  head.push(
    ...(summary.length > 0
      ? summary
      : ["No course, achievement, quest or path changed.", ""])
  );

  const tail = [
    "Opened by the Content release workflow, which force-pushes this branch on every release. Don't commit to it.",
  ];

  // The commit list is the only part that can grow without bound, so it is
  // the part that gives way to keep the body under GitHub's limit.
  let budget =
    MAX_BODY -
    [...head, ...tail].join("\n").length -
    "- and 99999 more\n".length;
  const commits: string[] = [];
  for (const { sha, commit } of compare.commits.slice(0, MAX_COMMITS)) {
    const line = `- ${inert(commit.message.split("\n")[0]!)} ([\`${shortSha(sha)}\`](${contentCommitUrl(sha)}))`;
    if (line.length + 1 > budget) break;
    commits.push(line);
    budget -= line.length + 1;
  }
  const more = compare.total_commits - commits.length;
  if (more > 0) commits.push(`- and ${more} more`);
  if (commits.length > 0) commits.push("");

  return `${[...head, ...commits, ...tail].join("\n")}\n`;
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
