/**
 * Push the "Metaplex NFTs" course to Sanity CMS.
 * Run: cd app && npx tsx ../scripts/push-metaplex-nfts-course.ts
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

import { MODULE_NFT_FUNDAMENTALS } from "./metaplex-nfts-course/mod1-nft-fundamentals";
import { MODULE_NFT_OPERATIONS } from "./metaplex-nfts-course/mod2-nft-operations";
import { MODULE_NFT_PLUGINS } from "./metaplex-nfts-course/mod3-nft-plugins";

const MODULES = [MODULE_NFT_FUNDAMENTALS, MODULE_NFT_OPERATIONS, MODULE_NFT_PLUGINS];

const totalLessons = MODULES.reduce((sum, mod) => sum + mod.lessons.length, 0);

const course = {
  _id: "course-metaplex-nfts",
  _type: "course",
  courseId: "metaplex-nfts",
  title: "Metaplex NFTs",
  slug: { _type: "slug", current: "metaplex-nfts" },
  description:
    "Create, manage, and trade NFTs on Solana using Metaplex Core. Learn to build digital collectibles with plugins for royalties, soulbound tokens, and compressed NFTs for large-scale minting.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 4,
  trackLevel: 2,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.35)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Understand Metaplex Core vs Token Metadata for NFTs",
    "Create, fetch, transfer, update, and burn NFTs using Umi SDK",
    "Build NFT collections with Metaplex Core",
    "Use plugins for royalties, freeze delegates, and soulbound tokens",
    "Create compressed NFTs with Bubblegum for large-scale minting",
    "Query NFTs using the DAS API",
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
  console.log("Pushing Metaplex NFTs course to Sanity...");
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
