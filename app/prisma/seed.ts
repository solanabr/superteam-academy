import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getAchievements } from "./seed-data/achievements";
import { getCourse1 } from "./seed-data/course-1";
import { getCourse2 } from "./seed-data/course-2";
import { getCourse3 } from "./seed-data/course-3";
import { getCourse4 } from "./seed-data/course-4";
import { getCourse5 } from "./seed-data/course-5";
import { getCourse6 } from "./seed-data/course-6";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...\n");

  // ── Clear existing data (in correct order for FK constraints) ──────────────
  console.log("  Clearing existing data...");
  await prisma.dailyChallengeCompletion.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.xPEvent.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.userCredential.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.streakData.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.newsletter.deleteMany();
  console.log("  ✓ Cleared\n");

  // ── Seed Achievements ─────────────────────────────────────────────────────
  console.log("  Seeding achievements...");
  const achievements = getAchievements();
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }
  console.log(`  ✓ ${achievements.length} achievements\n`);

  // ── Seed Courses ──────────────────────────────────────────────────────────
  const allCourses = [
    getCourse1(),
    getCourse2(),
    getCourse3(),
    getCourse4(),
    getCourse5(),
    getCourse6(),
  ];

  for (const courseData of allCourses) {
    console.log(`  Seeding course: ${courseData.title}...`);
    await prisma.course.create({ data: courseData });
    const moduleCount = courseData.modules.create.length;
    const lessonCount = courseData.modules.create.reduce(
      (sum: number, m: { lessons: { create: unknown[] } }) =>
        sum + m.lessons.create.length,
      0,
    );
    console.log(`  ✓ ${moduleCount} modules, ${lessonCount} lessons\n`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const courseCount = await prisma.course.count();
  const moduleCountTotal = await prisma.module.count();
  const lessonCountTotal = await prisma.lesson.count();
  const challengeCount = await prisma.challenge.count();
  const achievementCount = await prisma.achievement.count();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Courses:      ${courseCount}`);
  console.log(`  Modules:      ${moduleCountTotal}`);
  console.log(`  Lessons:      ${lessonCountTotal}`);
  console.log(`  Challenges:   ${challengeCount}`);
  console.log(`  Achievements: ${achievementCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🌱 Seed complete!");

  await pool.end();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
