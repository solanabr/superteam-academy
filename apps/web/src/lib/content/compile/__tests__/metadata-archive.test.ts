import { describe, it, expect } from "vitest";
import achievementsJson from "@/content/generated/achievements.json";
import archiveJson from "@/content/generated/metadata-archive.json";
import coursesJson from "@/content/generated/courses.json";
import {
  EMPTY_METADATA_ARCHIVE,
  mergeMetadataArchive,
  parseMetadataArchive,
  type MetadataArchive,
} from "../metadata-archive";
import { stableJson } from "../compile-bundle";

const course = (id: string, title: string) => ({
  _id: id,
  _type: "course",
  slug: { _type: "slug", current: id.replace("course-", "") },
  title,
  description: `${title} description`,
  difficulty: "beginner",
  thumbnail: `https://blob.example/${id}.webp`,
  creator: "WALLET",
  modules: [],
});

const achievement = (id: string, name: string) => ({
  _id: id,
  _type: "achievement",
  name,
  description: `${name} description`,
  category: "progress",
  xpReward: 10,
  award: { kind: "lessons-completed", gte: 1 },
});

const ids = (a: MetadataArchive) => ({
  achievements: a.achievements.map((x) => x._id),
  courses: a.courses.map((x) => x._id),
});

describe("mergeMetadataArchive", () => {
  it("keeps an id after it leaves content, with its last known fields", () => {
    const v1 = mergeMetadataArchive(EMPTY_METADATA_ARCHIVE, {
      achievements: [
        achievement("achievement-a", "A"),
        achievement("achievement-b", "B"),
      ],
      courses: [course("course-a", "Course A"), course("course-b", "Course B")],
    });
    const v2 = mergeMetadataArchive(v1, {
      achievements: [achievement("achievement-a", "A renamed")],
      courses: [course("course-b", "Course B")],
    });

    expect(ids(v2)).toEqual({
      achievements: ["achievement-a", "achievement-b"],
      courses: ["course-a", "course-b"],
    });
    expect(v2.achievements[0]!.name).toBe("A renamed");
    expect(v2.achievements[1]!.name).toBe("B");
    expect(v2.courses[0]!.title).toBe("Course A");
  });

  it("never drops an id, whatever the next bundle holds", () => {
    let archive = EMPTY_METADATA_ARCHIVE;
    const seen = new Set<string>();
    const releases = [["course-a", "course-b"], [], ["course-c"], ["course-a"]];
    for (const release of releases) {
      archive = mergeMetadataArchive(archive, {
        achievements: [],
        courses: release.map((id) => course(id, id)),
      });
      release.forEach((id) => seen.add(id));
      expect(new Set(archive.courses.map((c) => c._id))).toEqual(seen);
    }
  });

  it("stores only the fields metadata needs, never the creator or award rule", () => {
    const archive = mergeMetadataArchive(EMPTY_METADATA_ARCHIVE, {
      achievements: [achievement("achievement-a", "A")],
      courses: [course("course-a", "Course A")],
    });
    const json = JSON.stringify(archive);
    expect(json).not.toContain("WALLET");
    expect(json).not.toContain("lessons-completed");
  });

  it("is idempotent, so recompiling the same bundle is byte-identical", () => {
    const bundle = {
      achievements: [achievement("achievement-a", "A")],
      courses: [course("course-a", "Course A")],
    };
    const once = mergeMetadataArchive(EMPTY_METADATA_ARCHIVE, bundle);
    const twice = mergeMetadataArchive(
      parseMetadataArchive(stableJson(once)),
      bundle
    );
    expect(stableJson(twice)).toBe(stableJson(once));
  });
});

describe("parseMetadataArchive", () => {
  it("reads a missing file as an empty archive", () => {
    expect(parseMetadataArchive(null)).toEqual(EMPTY_METADATA_ARCHIVE);
  });

  it("refuses a file it can't read rather than recompiling over it", () => {
    expect(() => parseMetadataArchive("not json")).toThrow();
    expect(() => parseMetadataArchive("{}")).toThrow(/version 1/);
    expect(() =>
      parseMetadataArchive(
        JSON.stringify({ version: 1, achievements: [{}], courses: [] })
      )
    ).toThrow(/without an id/);
  });
});

describe("the committed archive", () => {
  const archive = parseMetadataArchive(JSON.stringify(archiveJson));

  it("holds every achievement and course in the bundle, as compiled now", () => {
    const fresh = mergeMetadataArchive(archive, {
      achievements: achievementsJson,
      courses: coursesJson,
    });
    expect(stableJson(fresh)).toBe(stableJson(archive));
  });
});
