/**
 * Push the "Metaplex Tokens" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-metaplex-tokens-course.ts
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

import { MODULE_TOKEN_BASICS } from "./metaplex-tokens-course/mod1-token-basics";
import { MODULE_TOKEN_OPERATIONS } from "./metaplex-tokens-course/mod2-token-operations";
import { MODULE_TOKEN_ADVANCED } from "./metaplex-tokens-course/mod3-token-advanced";

const MODULES = [MODULE_TOKEN_BASICS, MODULE_TOKEN_OPERATIONS, MODULE_TOKEN_ADVANCED];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-metaplex-tokens",
  _type: "course",
  courseId: "metaplex-tokens",
  title: "Metaplex Tokens",
  slug: { _type: "slug", current: "metaplex-tokens" },
  description:
    "Create, launch, and manage fungible tokens on Solana with Metaplex. Learn to mint, transfer, update, and burn tokens using Umi SDK, run Token Generation Events with Genesis Launch Pools, and build on-chain token programs with Anchor.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 4,
  trackLevel: 1,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Understand the Solana token model: Mint accounts, ATAs, Token Metadata",
    "Create fungible tokens with metadata using Metaplex Umi SDK",
    "Mint, transfer, update, and burn tokens programmatically",
    "Launch tokens using Genesis Launch Pools (TGE)",
    "Build Anchor programs that create tokens via CPI to Token Metadata",
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
  console.log("Pushing Metaplex Tokens course to Sanity...");
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
