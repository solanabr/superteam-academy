/**
 * Push the "Solana Getting Started" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-solana-getting-started.ts
 */

import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../app/.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-02-19",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

function k(): string {
  return Math.random().toString(36).substring(2, 14);
}

import { MODULE_INSTALLATION } from "./solana-getting-started-course/mod1-installation";
import { MODULE_QUICK_START } from "./solana-getting-started-course/mod2-quick-start";

const MODULES = [MODULE_INSTALLATION, MODULE_QUICK_START];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-solana-getting-started",
  _type: "course",
  courseId: "solana-getting-started",
  title: "Getting Started with Solana",
  slug: { _type: "slug", current: "solana-getting-started" },
  description:
    "Set up your Solana development environment and build your first programs. Learn to install the Solana CLI, Anchor, and Surfpool, then follow hands-on quick starts for reading data, writing transactions, deploying programs, PDAs, and CPIs.",
  difficulty: 1,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 5,
  trackLevel: 1,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Install Solana CLI, Anchor, and Surfpool",
    "Read data from the Solana network",
    "Build and send transactions",
    "Deploy your first on-chain program",
    "Work with PDAs and cross-program invocations",
  ],
  instructor: {
    name: "Superteam Academy",
    bio: "Official Solana education platform",
  },
  modules: MODULES.map((mod, i) => ({
    _key: k(),
    _type: "module",
    title: mod.title,
    description: mod.description,
    order: i,
    lessons: mod.lessons.map((lesson, j) => {
      const doc: Record<string, unknown> = {
        _key: k(),
        _type: "lesson",
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        order: j,
        xp: 30,
        duration: lesson.duration,
        htmlContent: lesson.content ?? null,
      };
      if (lesson.quiz) {
        doc.quiz = {
          ...lesson.quiz,
          questions: lesson.quiz.questions.map((q) => ({ _key: k(), ...q })),
        };
      }
      if (lesson.challenge) {
        doc.challenge = {
          ...lesson.challenge,
          testCases: (lesson.challenge.testCases ?? []).map((tc) => ({
            _key: k(),
            _type: "object",
            ...tc,
          })),
        };
      }
      return doc;
    }),
  })),
};

async function main() {
  console.log("Pushing Solana Getting Started course to Sanity...");
  console.log(`  Modules: ${MODULES.length}`);
  console.log(`  Lessons: ${totalLessons}`);
  console.log(`  XP: ${totalLessons * 30}`);
  await client.createOrReplace(course);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
