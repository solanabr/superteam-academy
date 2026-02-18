import "server-only";

import type { Course } from "@/lib/course-catalog";
import type { RoadmapDef } from "@/lib/roadmaps/types";
import { getDb } from "./mongodb";

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function getAllCourses(): Promise<Course[]> {
  const db = await getDb();
  return db.collection<Course>("courses").find({}).toArray() as Promise<
    Course[]
  >;
}

export async function getCourse(slug: string): Promise<Course | null> {
  const db = await getDb();
  return db
    .collection<Course>("courses")
    .findOne({ slug }) as Promise<Course | null>;
}

export async function upsertCourse(course: Course): Promise<void> {
  const db = await getDb();
  await db
    .collection("courses")
    .updateOne({ slug: course.slug }, { $set: course }, { upsert: true });
}

export async function deleteCourse(slug: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("courses").deleteOne({ slug });
  return result.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Roadmaps
// ---------------------------------------------------------------------------

export async function getAllRoadmaps(): Promise<RoadmapDef[]> {
  const db = await getDb();
  return db.collection<RoadmapDef>("roadmaps").find({}).toArray() as Promise<
    RoadmapDef[]
  >;
}

export async function getRoadmapBySlug(
  slug: string,
): Promise<RoadmapDef | null> {
  const db = await getDb();
  return db
    .collection<RoadmapDef>("roadmaps")
    .findOne({ slug }) as Promise<RoadmapDef | null>;
}

export async function upsertRoadmap(roadmap: RoadmapDef): Promise<void> {
  const db = await getDb();
  await db
    .collection("roadmaps")
    .updateOne({ slug: roadmap.slug }, { $set: roadmap }, { upsert: true });
}

export async function deleteRoadmap(slug: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("roadmaps").deleteOne({ slug });
  return result.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Platform Config
// ---------------------------------------------------------------------------

export type PlatformConfig = {
  dailyXpCap: number;
  maxStreakFreeze: number;
  maintenanceMode: boolean;
  registrationOpen: boolean;
};

const DEFAULT_CONFIG: PlatformConfig = {
  dailyXpCap: 500,
  maxStreakFreeze: 3,
  maintenanceMode: false,
  registrationOpen: true,
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const db = await getDb();
  const doc = await db.collection("platform_config").findOne({ key: "main" });
  if (!doc) return { ...DEFAULT_CONFIG };
  const { _id, key, ...config } = doc;
  return { ...DEFAULT_CONFIG, ...config } as PlatformConfig;
}

export async function updatePlatformConfig(
  updates: Partial<PlatformConfig>,
): Promise<PlatformConfig> {
  const db = await getDb();
  const result = await db
    .collection("platform_config")
    .findOneAndUpdate(
      { key: "main" },
      { $set: updates },
      { upsert: true, returnDocument: "after" },
    );
  const { _id, key, ...config } = result!;
  return { ...DEFAULT_CONFIG, ...config } as PlatformConfig;
}
