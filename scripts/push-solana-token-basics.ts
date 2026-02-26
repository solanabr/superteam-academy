/**
 * Push the "Solana Token Basics" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-solana-token-basics.ts
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

import { MODULE_TOKEN_FUNDAMENTALS } from "./solana-token-basics-course/mod1-token-fundamentals";
import { MODULE_TOKEN_MANAGEMENT } from "./solana-token-basics-course/mod2-token-management";

const MODULES = [MODULE_TOKEN_FUNDAMENTALS, MODULE_TOKEN_MANAGEMENT];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-solana-token-basics",
  _type: "course",
  courseId: "solana-token-basics",
  title: "Solana Token Basics",
  slug: { _type: "slug", current: "solana-token-basics" },
  description:
    "Learn the SPL Token standard on Solana. Create mints, token accounts, mint tokens, transfer, delegate, burn, freeze, and manage token authorities.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 5,
  trackLevel: 3,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Understand the SPL Token model: mints, ATAs, and authorities",
    "Create token mints and token accounts",
    "Mint, transfer, and burn tokens",
    "Manage delegates, authorities, and frozen accounts",
    "Work with wrapped SOL and native tokens",
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
  console.log("Pushing Solana Token Basics course to Sanity...");
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
