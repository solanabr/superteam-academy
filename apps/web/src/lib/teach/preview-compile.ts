import "server-only";

import type { Course, Lesson } from "@superteam-lms/types";
import { serverEnv } from "@/lib/env.server";
import { GitHubUnavailableError } from "@/lib/github/types";
import { extractTarball } from "@/lib/content/compile/tarball";
import { compileContent } from "@/lib/content/compile/compile-bundle";
import { ContentValidationError } from "@/lib/content/compile/types";
import { projectCourse } from "@/lib/content/project";
import type { CourseProjectionDeps } from "@/lib/content/project";
import { CONTENT_REPO } from "./pr-url";
import { changedCourseDirs, changedCourseIds } from "./pr-files";

/**
 * Compiles an academy-courses PR into the same JSON modules the live site reads
 * (#828), so a teacher's preview cannot drift from what actually ships.
 *
 * The pipeline is exactly the production one — `extractTarball` +
 * `compileContent` — just pointed at the PR's head commit and kept entirely in
 * memory. Nothing is written to `src/content/generated`, `content.lock` is not
 * touched, and there is no on-chain effect.
 */

const API = "https://api.github.com";

// Derived from the projector's own signature so this file needs no new exports
// from `lib/content/project` — the doc shapes stay private to that module.
type CourseDocT = Parameters<typeof projectCourse>[0];
type LessonDocT =
  CourseProjectionDeps["lessonsById"] extends ReadonlyMap<string, infer V>
    ? V
    : never;

/**
 * `academy-courses` is PUBLIC, so every read here works unauthenticated (#830).
 * The token is used when configured — unauthenticated GitHub is 60 req/hr per
 * IP and shared egress like Vercel burns that quickly — but it is never
 * required, so a fresh checkout with no `GITHUB_TOKEN` can still preview.
 *
 * `lib/github/github.ts` deliberately keeps requiring the token: its callers are
 * admin paths where a silent drop to an anonymous rate limit would be worse
 * than failing loudly.
 */
function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = serverEnv.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Rate limiting is the one failure a missing token actually causes — name it. */
function rateLimitError(res: Response): GitHubUnavailableError | null {
  const remaining = res.headers.get("x-ratelimit-remaining");
  if ((res.status === 403 || res.status === 429) && remaining === "0") {
    return new GitHubUnavailableError(
      serverEnv.GITHUB_TOKEN
        ? "GitHub rate limit reached. Try again shortly."
        : "GitHub rate limit reached for anonymous requests. Set GITHUB_TOKEN for a higher limit."
    );
  }
  return null;
}

async function ghFetch(path: string, accept?: string): Promise<Response> {
  const headers = ghHeaders();
  if (accept) headers.Accept = accept;

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { headers, cache: "no-store" });
  } catch (e) {
    throw new GitHubUnavailableError(
      e instanceof Error ? e.message : String(e)
    );
  }

  const limited = rateLimitError(res);
  if (limited) throw limited;
  return res;
}

/** A PR's head commit plus the bits of metadata the preview header shows. */
export interface PrHead {
  sha: string;
  title: string;
  author: string | null;
  branch: string | null;
  state: string;
}

export async function fetchPrHead(number: number): Promise<PrHead> {
  const res = await ghFetch(`/repos/${CONTENT_REPO}/pulls/${number}`);

  if (res.status === 404) {
    throw new GitHubUnavailableError(`Pull request #${number} not found`);
  }
  if (!res.ok) {
    throw new GitHubUnavailableError(`GitHub pulls/${number} → ${res.status}`);
  }

  const body = (await res.json()) as {
    head?: { sha?: string; ref?: string };
    title?: string;
    state?: string;
    user?: { login?: string };
  };

  const sha = body.head?.sha;
  if (!sha) {
    throw new GitHubUnavailableError(
      `Pull request #${number} response missing head.sha`
    );
  }

  return {
    sha,
    title: body.title ?? `PR #${number}`,
    author: body.user?.login ?? null,
    branch: body.head?.ref ?? null,
    state: body.state ?? "unknown",
  };
}

/**
 * Changed file paths of a PR, for scoping the preview to its courses (#831).
 * Paginated (100/page, capped at 5 pages — a content PR is dozens of files,
 * not hundreds). BEST-EFFORT: any failure returns [], which downstream means
 * "don't filter" — scoping is a nicety and must never take the preview down.
 */
export async function fetchPrChangedFiles(number: number): Promise<string[]> {
  const paths: string[] = [];
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await ghFetch(
        `/repos/${CONTENT_REPO}/pulls/${number}/files?per_page=100&page=${page}`
      );
      if (!res.ok) return [];
      const body = (await res.json()) as { filename?: string }[];
      for (const f of body) {
        if (typeof f.filename === "string") paths.push(f.filename);
      }
      if (body.length < 100) break;
    }
  } catch {
    return [];
  }
  return paths;
}

/**
 * The compiled PR, in exactly the shapes the real page components consume.
 * Produced with the SAME projector the live site uses (`projectCourse` /
 * `projectLesson`), so a previewed course is structurally identical to a
 * published one — modules carry hydrated lessons, not refs.
 */
export interface PreviewResult {
  head: PrHead;
  courses: Course[];
  /** Hydrated lessons per course id, in course order. */
  lessonsByCourse: Record<string, Lesson[]>;
  /**
   * Per-course XP, keyed by course id. Read from the raw doc because the
   * projected `Course` does not carry it — the live lesson page fetches it
   * separately via `getCourseIdBySlug`.
   */
  xpPerLessonById: Record<string, number>;
  /**
   * Ids of the courses this PR adds or modifies — what the teacher came to
   * see. EMPTY means "show everything": the PR touches no course dir, or a
   * touched dir could not be matched to a compiled course (fail open, #831).
   */
  changedCourseIds: string[];
  counts: Record<string, number>;
}

/** Narrow a parsed JSON module to an array of records without using `any`. */
function readArray(
  files: Map<string, string>,
  name: string
): Record<string, unknown>[] {
  const raw = files.get(name);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
}

/**
 * Resolves a PR to its compiled content. Throws `ContentValidationError` when
 * the PR's content fails schema/executor validation — the caller surfaces those
 * issues verbatim, since they are exactly what CI would report.
 */
export async function compilePrPreview(
  number: number,
  opts: { fetchHead?: typeof fetchPrHead } = {}
): Promise<PreviewResult> {
  const head = await (opts.fetchHead ?? fetchPrHead)(number);

  // `tarball/<sha>` 302-redirects to codeload; fetch follows redirects.
  const res = await ghFetch(
    `/repos/${CONTENT_REPO}/tarball/${head.sha}`,
    "application/vnd.github+json"
  );
  if (!res.ok) {
    throw new GitHubUnavailableError(
      `GitHub tarball/${head.sha.slice(0, 7)} → ${res.status}`
    );
  }
  const tree = await extractTarball(new Uint8Array(await res.arrayBuffer()));

  // `compiledAt: null` — the preview is not a reproducible bundle and must never
  // stamp a wall-clock time that would differ from a real compile of this SHA.
  const files = compileContent(tree, { sha: head.sha, compiledAt: null });

  // Courses reference their lessons (`_ref`), so hydration runs through the
  // projector rather than a field on the lesson — lessons carry no back-pointer.
  const lessonsById = new Map<string, LessonDocT>();
  for (const doc of readArray(files, "lessons.json")) {
    lessonsById.set(String(doc._id), doc as unknown as LessonDocT);
  }

  const courseDocs = readArray(files, "courses.json");
  const courses = courseDocs.map((doc) =>
    projectCourse(
      doc as unknown as CourseDocT,
      { lessonsById },
      {
        fullLessons: true,
      }
    )
  );

  // Flatten each projected course's modules back into an ordered lesson list —
  // the same order the curriculum renders, so prev/next in the preview matches.
  const lessonsByCourse: Record<string, Lesson[]> = {};
  for (const course of courses) {
    lessonsByCourse[course._id] = (course.modules ?? []).flatMap(
      (m) => (m.lessons ?? []) as Lesson[]
    );
  }

  let counts: Record<string, number> = {};
  const metaRaw = files.get("meta.json");
  if (metaRaw) {
    const meta = JSON.parse(metaRaw) as { counts?: Record<string, number> };
    counts = meta.counts ?? {};
  }

  const xpPerLessonById: Record<string, number> = {};
  for (const doc of courseDocs) {
    const xp = doc.xpPerLesson;
    xpPerLessonById[String(doc._id)] = typeof xp === "number" ? xp : 0;
  }

  // Scope to the PR's own courses (#831) — dir names from the changed files,
  // matched to compiled slugs. Best-effort by construction on both sides.
  const touched = changedCourseDirs(await fetchPrChangedFiles(number));
  const changed = changedCourseIds(courses, touched);

  return {
    head,
    courses,
    lessonsByCourse,
    xpPerLessonById,
    changedCourseIds: changed,
    counts,
  };
}

export { ContentValidationError, GitHubUnavailableError };
