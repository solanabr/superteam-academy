/**
 * Push the "Metaplex Smart Contracts" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-metaplex-smart-contracts-course.ts
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

import { MODULE_CORE_PROGRAM } from "./metaplex-smart-contracts-course/mod1-core-program";
import { MODULE_TOKEN_METADATA_CANDY } from "./metaplex-smart-contracts-course/mod2-token-metadata-candy";
import { MODULE_ADVANCED_PROGRAMS } from "./metaplex-smart-contracts-course/mod3-advanced-programs";

const MODULES = [MODULE_CORE_PROGRAM, MODULE_TOKEN_METADATA_CANDY, MODULE_ADVANCED_PROGRAMS];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-metaplex-smart-contracts",
  _type: "course",
  courseId: "metaplex-smart-contracts",
  title: "Metaplex Smart Contracts",
  slug: { _type: "slug", current: "metaplex-smart-contracts" },
  description:
    "Master Metaplex's production-ready smart contracts — Core (next-gen NFTs), Token Metadata, Candy Machine (NFT launchpads), Bubblegum (compressed NFTs), Inscription, MPL-Hybrid, and Genesis (token launches).",
  difficulty: 3,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 4,
  trackLevel: 3,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.45)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Understand the Metaplex Core program architecture and plugin system",
    "Perform CRUD operations on Core assets using JavaScript and Rust SDKs",
    "Master all Core plugins: royalties, freeze, burn, transfer delegates, and more",
    "Use Token Metadata for fungible tokens and Programmable NFTs",
    "Build NFT launchpads with Core Candy Machine and mint guards",
    "Create compressed NFTs at scale with Bubblegum v2",
    "Store data on-chain with the Inscription program",
    "Build hybrid NFT/token swap systems with MPL-404",
    "Launch tokens with Genesis launch pools and presales",
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
  console.log("Pushing Metaplex Smart Contracts course to Sanity...");
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
