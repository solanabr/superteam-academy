/**
 * Push the "Solana TypeScript SDK" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-solana-typescript-sdk.ts
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

import { MODULE_TYPESCRIPT_SDK } from "./solana-typescript-sdk-course/mod1-typescript-sdk";

const MODULES = [MODULE_TYPESCRIPT_SDK];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-solana-typescript-sdk",
  _type: "course",
  courseId: "solana-typescript-sdk",
  title: "Solana TypeScript SDK",
  slug: { _type: "slug", current: "solana-typescript-sdk" },
  description:
    "Master the official Solana TypeScript SDK: @solana/kit, @solana/web3.js, signers, wallet adapters, priority fees, address lookup tables, and production retry patterns.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 5,
  trackLevel: 8,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Use @solana/kit for modern Solana TypeScript development",
    "Work with legacy @solana/web3.js and migration paths",
    "Implement signing patterns: keypair, wallet adapter, multisig",
    "Optimize transactions with priority fees and ALTs",
    "Build production-grade clients with retry logic",
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
  console.log("Pushing Solana TypeScript SDK course to Sanity...");
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
