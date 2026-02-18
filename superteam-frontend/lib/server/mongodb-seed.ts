import type { Db } from "mongodb";
import { courses as seedCourses } from "@/lib/course-catalog";
import { roadmaps as seedRoadmaps } from "@/lib/roadmaps";

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
