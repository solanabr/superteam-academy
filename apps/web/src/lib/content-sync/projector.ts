import type { BlockT } from "@superteam-lms/content-schema";
import type { ValidatedContent } from "./validate";
import type { SanityDoc } from "./types";
import { rewriteMarkdownAssetPaths } from "./assets";

export interface AssetUpload {
  path: string; // repo-relative image path
  bytes: Uint8Array;
}

/** Maps a repo-relative image path to its resolved CDN url string, or null if none.
 *  Markdown rewriting needs a plain url, not a Sanity image reference. */
export type AssetResolver = (repoRelativePath: string) => string | null;

/** Reads a code block's resolved tests.json array for a given lesson dir + path. */
export type TestsResolver = (dir: string, testsRelPath: string) => unknown[];

const weakRef = (
  ref: string
): { _type: string; _ref: string; _weak: boolean; _key: string } => ({
  _type: "reference",
  _ref: ref,
  _weak: true,
  _key: ref,
});

function projectBlock(
  block: BlockT,
  dir: string,
  v: ValidatedContent,
  resolveAsset: AssetResolver,
  resolveTests: TestsResolver
): Record<string, unknown> {
  const rec = block as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {
    _key: rec.key as string,
    _type: rec.type as string,
  };
  for (const [k, val] of Object.entries(rec)) {
    if (k === "key" || k === "type") continue;
    out[k] = val;
  }
  // Resolve repo paths → content (spec §9.6, §10.2).
  if (block.type === "prose") {
    // Rewrite repo-relative image paths (`assets/x.png`) → CDN urls so the markdown
    // a learner reads resolves once the repo tree is gone (§9.6). `resolveAsset` keys
    // on the full repo path, so join the lesson dir onto each markdown-relative path.
    const rawMd = v.prose.get(`${dir}/${block.src}`) ?? "";
    out.src = rewriteMarkdownAssetPaths(rawMd, (rel) =>
      resolveAsset(`${dir}/${rel}`)
    );
  }
  if (block.type === "code") {
    out.starter = v.code.get(`${dir}/${block.starter}`) ?? "";
    out.solution = v.code.get(`${dir}/${block.solution}`) ?? "";
    out.tests = resolveTests(dir, block.tests);
  }
  if (block.type === "program-explorer") {
    const idlPath = (rec.idl as string | undefined) ?? "";
    out.idl = idlPath ? (v.idl.get(`${dir}/${idlPath}`) ?? "") : "";
  }
  return out;
}

function stripId(
  obj: Record<string, unknown>,
  alsoDrop: string[] = []
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(obj)) {
    if (k === "id" || alsoDrop.includes(k)) continue;
    out[k] = val;
  }
  return out;
}

/**
 * Project validated repo content into managed Sanity documents. Deterministic:
 * `_id` = content id, `_key` = block key, module refs weak (§9.5). Every field
 * is a pure function of the repo or the `sync` marker (§9.3 invariant).
 */
export function projectContent(
  v: ValidatedContent,
  sha: string,
  resolveAsset: AssetResolver,
  resolveTests: TestsResolver
): { docs: SanityDoc[]; assets: AssetUpload[] } {
  const marker = { source: "academy-courses", rev: sha } as const;
  const docs: SanityDoc[] = [];
  const assets: AssetUpload[] = [...v.assets.entries()].map(
    ([path, bytes]) => ({
      path,
      bytes,
    })
  );

  for (const c of v.courses) {
    docs.push({
      _id: c.id,
      _type: "course",
      title: c.title,
      slug: { _type: "slug", current: c.slug },
      description: c.description,
      difficulty: c.difficulty,
      duration: c.duration,
      xpPerLesson: c.xpPerLesson,
      xpReward: c.xpReward,
      trackId: c.trackId ?? 0,
      trackLevel: c.trackLevel ?? 0,
      creatorRewardXp: c.creatorRewardXp ?? 0,
      minCompletionsForReward: c.minCompletionsForReward ?? 0,
      tags: c.tags ?? [],
      creator: { githubId: c.creator.githubId },
      instructor: c.instructor ? weakRef(c.instructor) : undefined,
      prerequisiteCourse: c.prerequisiteCourse
        ? weakRef(c.prerequisiteCourse)
        : undefined,
      modules: c.modules.map((m) => ({
        _type: "courseModule",
        _key: m.key,
        key: m.key,
        title: m.title,
        description: m.description,
        lessons: m.lessons.map(weakRef),
      })),
      sync: marker,
    });
  }

  for (const { dir, lesson } of v.lessons) {
    docs.push({
      _id: lesson.id,
      _type: "lesson",
      title: lesson.title,
      slug: { _type: "slug", current: lesson.slug },
      blocks: lesson.blocks.map((b) =>
        projectBlock(b, dir, v, resolveAsset, resolveTests)
      ),
      sync: marker,
    });
  }

  for (const i of v.instructors as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: i.id, _type: "instructor", ...stripId(i), sync: marker });
  }
  for (const p of v.paths as {
    id: string;
    courses?: string[];
    [k: string]: unknown;
  }[]) {
    docs.push({
      _id: p.id,
      _type: "learningPath",
      ...stripId(p, ["courses"]),
      courses: (p.courses ?? []).map(weakRef),
      sync: marker,
    });
  }
  for (const a of v.achievements as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: a.id, _type: "achievement", ...stripId(a), sync: marker });
  }
  for (const q of v.quests as { id: string; [k: string]: unknown }[]) {
    docs.push({ _id: q.id, _type: "quest", ...stripId(q), sync: marker });
  }

  return { docs, assets };
}
