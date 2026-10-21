/**
 * Append-only record of every achievement and course the compiler has ever
 * emitted, with the fields their NFT metadata is built from.
 *
 * Achievement types and course collections carry a metadata URI on-chain that
 * can never change, and every NFT minted into them points at it. Retiring an
 * achievement or a course from content must not turn those URIs into 404s, so
 * the metadata routes fall back to this archive for ids the bundle no longer
 * has.
 *
 * `compile-content` reads the committed archive, merges the fresh bundle into
 * it and writes it back next to the bundle. The merge keeps every id it was
 * given and refreshes the fields of ids still in content, so recompiling the
 * same SHA is byte-identical and CI's freshness check covers the file.
 */

export const METADATA_ARCHIVE_FILE = "metadata-archive.json";

export interface ArchivedAchievement {
  _id: string;
  _type: "achievement";
  name: string | null;
  description: string | null;
  category: string | null;
  xpReward: number | null;
}

export interface ArchivedCourse {
  _id: string;
  _type: "course";
  slug: { _type: "slug"; current: string };
  title: string | null;
  description: string | null;
  difficulty: string | null;
  thumbnail: string | null;
}

export interface MetadataArchive {
  version: 1;
  achievements: ArchivedAchievement[];
  courses: ArchivedCourse[];
}

export const EMPTY_METADATA_ARCHIVE: MetadataArchive = {
  version: 1,
  achievements: [],
  courses: [],
};

type Doc = Record<string, unknown>;

const str = (value: unknown): string | null =>
  typeof value === "string" ? value : null;
const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function isRecord(value: unknown): value is Doc {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function archiveAchievement(doc: Doc): ArchivedAchievement | null {
  const id = str(doc._id);
  if (!id) return null;
  return {
    _id: id,
    _type: "achievement",
    name: str(doc.name),
    description: str(doc.description),
    category: str(doc.category),
    xpReward: num(doc.xpReward),
  };
}

function archiveCourse(doc: Doc): ArchivedCourse | null {
  const id = str(doc._id);
  const slug = isRecord(doc.slug) ? str(doc.slug.current) : null;
  if (!id || !slug) return null;
  return {
    _id: id,
    _type: "course",
    slug: { _type: "slug", current: slug },
    title: str(doc.title),
    description: str(doc.description),
    difficulty: str(doc.difficulty),
    thumbnail: str(doc.thumbnail),
  };
}

/**
 * Parse the committed archive. A missing file is an empty archive; a file that
 * doesn't parse throws, because carrying on would rewrite it without the ids
 * it held.
 */
export function parseMetadataArchive(text: string | null): MetadataArchive {
  if (text === null) return EMPTY_METADATA_ARCHIVE;
  const raw: unknown = JSON.parse(text);
  if (
    !isRecord(raw) ||
    raw.version !== 1 ||
    !Array.isArray(raw.achievements) ||
    !Array.isArray(raw.courses)
  ) {
    throw new Error(
      `${METADATA_ARCHIVE_FILE} is not a version 1 metadata archive; fix it rather than recompiling over it`
    );
  }
  const achievements = raw.achievements.map((d) =>
    isRecord(d) ? archiveAchievement(d) : null
  );
  const courses = raw.courses.map((d) =>
    isRecord(d) ? archiveCourse(d) : null
  );
  if (achievements.includes(null) || courses.includes(null)) {
    throw new Error(`${METADATA_ARCHIVE_FILE} has an entry without an id`);
  }
  return {
    version: 1,
    achievements: achievements as ArchivedAchievement[],
    courses: courses as ArchivedCourse[],
  };
}

function mergeById<T extends { _id: string }>(
  previous: readonly T[],
  current: readonly T[]
): T[] {
  const byId = new Map<string, T>();
  for (const entry of previous) byId.set(entry._id, entry);
  for (const entry of current) byId.set(entry._id, entry);
  return [...byId.values()].sort((a, b) =>
    a._id < b._id ? -1 : a._id > b._id ? 1 : 0
  );
}

/**
 * The previous archive plus the current bundle. Ids still in content take
 * their current fields; ids that left content keep their last known ones.
 * Nothing is ever removed.
 */
export function mergeMetadataArchive(
  previous: MetadataArchive,
  bundle: { achievements: readonly unknown[]; courses: readonly unknown[] }
): MetadataArchive {
  const achievements = bundle.achievements
    .map((d) => (isRecord(d) ? archiveAchievement(d) : null))
    .filter((d): d is ArchivedAchievement => d !== null);
  const courses = bundle.courses
    .map((d) => (isRecord(d) ? archiveCourse(d) : null))
    .filter((d): d is ArchivedCourse => d !== null);
  return {
    version: 1,
    achievements: mergeById(previous.achievements, achievements),
    courses: mergeById(previous.courses, courses),
  };
}
