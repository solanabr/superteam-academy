/**
 * Push the "Solana Frontend Development" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-solana-frontend.ts
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

import { MODULE_SOLANA_FRONTEND } from "./solana-frontend-course/mod1-frontend";

const MODULES = [MODULE_SOLANA_FRONTEND];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-solana-frontend",
  _type: "course",
  courseId: "solana-frontend",
  title: "Solana Frontend Development",
  slug: { _type: "slug", current: "solana-frontend" },
  description:
    "Build web applications on Solana with @solana/client, React hooks, wallet adapters, Next.js integration, and the web3-compat migration layer.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 5,
  trackLevel: 6,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Use @solana/client for RPC queries and subscriptions",
    "Build React components with @solana/react-hooks",
    "Integrate wallet adapters for user authentication",
    "Set up Next.js projects with Solana providers",
    "Migrate from legacy web3.js to the modern SDK",
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
  console.log("Pushing Solana Frontend Development course to Sanity...");
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
