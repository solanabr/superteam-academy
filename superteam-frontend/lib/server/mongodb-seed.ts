import type { Db } from "mongodb";
import { revalidateTag } from "next/cache";
import { courses as seedCourses } from "@/lib/course-catalog";
import { roadmaps as seedRoadmaps } from "@/lib/roadmaps";
import { CacheTags } from "./cache-tags";

const DEFAULT_CONFIG = {
  key: "main",
  dailyXpCap: 500,
  maxStreakFreeze: 3,
  maintenanceMode: false,
  registrationOpen: true,
};

export async function seedIfEmpty(db: Db): Promise<void> {
  const [courseCount, roadmapCount, configCount] = await Promise.all([
    db.collection("courses").countDocuments(),
    db.collection("roadmaps").countDocuments(),
    db.collection("platform_config").countDocuments(),
  ]);

  const ops: Promise<unknown>[] = [];

  if (courseCount === 0 && seedCourses.length > 0) {
    ops.push(
      db.collection("courses").insertMany(seedCourses.map((c) => ({ ...c }))),
    );
  }

  if (roadmapCount === 0 && seedRoadmaps.length > 0) {
    ops.push(
      db.collection("roadmaps").insertMany(seedRoadmaps.map((r) => ({ ...r }))),
    );
  }

  if (configCount === 0) {
    ops.push(db.collection("platform_config").insertOne({ ...DEFAULT_CONFIG }));
  }

  await Promise.all(ops);
}

export async function seedNewCourses(db: Db): Promise<void> {
  const col = db.collection("courses");
  const results = await Promise.all(
    seedCourses.map((c) =>
      col.updateOne(
        { slug: c.slug },
        { $setOnInsert: { ...c } },
        { upsert: true },
      ),
    ),
  );
  const inserted = results.some((r) => r.upsertedCount > 0);
  if (inserted) {
    revalidateTag(CacheTags.COURSES, "max");
  }
}
