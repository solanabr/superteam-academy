import { PrismaClient } from "../superteam-academy/app/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getRustForSolanaCourse } from "./courses/rust-for-solana";
import { getAdvancedAnchorPatternsCourse } from "./courses/advanced-anchor-patterns";

const SHOWCASE_SLUGS = ["rust-for-solana", "advanced-anchor-patterns"];

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding showcase courses...\n");

  // ── Non-destructive upsert: delete only the new courses, leave existing ones ─
  console.log("  Removing any previous showcase courses...");
  for (const slug of SHOWCASE_SLUGS) {
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      // Delete child records first (cascade not guaranteed by all adapters)
      const modules = await prisma.module.findMany({
        where: { courseId: existing.id },
      });
      for (const mod of modules) {
        const lessons = await prisma.lesson.findMany({
          where: { moduleId: mod.id },
        });
        for (const lesson of lessons) {
          await prisma.testCase.deleteMany({
            where: { challenge: { lessonId: lesson.id } },
          });
          await prisma.challenge.deleteMany({ where: { lessonId: lesson.id } });
          await prisma.lessonCompletion.deleteMany({
            where: { lessonId: lesson.id },
          });
        }
        await prisma.lesson.deleteMany({ where: { moduleId: mod.id } });
      }
      await prisma.module.deleteMany({ where: { courseId: existing.id } });
      await prisma.enrollment.deleteMany({ where: { courseId: existing.id } });
      await prisma.course.delete({ where: { id: existing.id } });
      console.log(`  ✓ Removed existing: ${slug}`);
    }
  }
  console.log();

  // ── Seed the new courses ──────────────────────────────────────────────────
  const showcaseCourses = [
    getRustForSolanaCourse(),
    getAdvancedAnchorPatternsCourse(),
  ];

  for (const courseData of showcaseCourses) {
    console.log(`  Seeding: ${courseData.title}...`);
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
  const moduleCount = await prisma.module.count();
  const lessonCount = await prisma.lesson.count();
  const challengeCount = await prisma.challenge.count();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Total courses:    ${courseCount}`);
  console.log(`  Total modules:    ${moduleCount}`);
  console.log(`  Total lessons:    ${lessonCount}`);
  console.log(`  Total challenges: ${challengeCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🌱 Showcase seed complete!");

  await pool.end();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
