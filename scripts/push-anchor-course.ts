/**
 * Push the comprehensive "Anchor Framework" course to Sanity CMS.
 * Structure follows exactly https://www.anchor-lang.com/docs
 *
 * Run: cd app && npx tsx ../scripts/push-anchor-course.ts
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

// ─── Module 1: Getting Started ──────────────────────────
import { MODULE_GETTING_STARTED } from "./anchor-course/mod1-getting-started";
// ─── Module 2: The Basics ───────────────────────────────
import { MODULE_BASICS } from "./anchor-course/mod2-basics";
// ─── Module 3: Client Libraries ─────────────────────────
import { MODULE_CLIENTS } from "./anchor-course/mod3-clients";
// ─── Module 4: Testing Libraries ────────────────────────
import { MODULE_TESTING } from "./anchor-course/mod4-testing";
// ─── Module 5: Additional Features ──────────────────────
import { MODULE_FEATURES } from "./anchor-course/mod5-features";
// ─── Module 6: SPL Tokens ───────────────────────────────
import { MODULE_TOKENS } from "./anchor-course/mod6-tokens";
// ─── Module 7: References ───────────────────────────────
import { MODULE_REFERENCES } from "./anchor-course/mod7-references";

const MODULES = [
  MODULE_GETTING_STARTED,
  MODULE_BASICS,
  MODULE_CLIENTS,
  MODULE_TESTING,
  MODULE_FEATURES,
  MODULE_TOKENS,
  MODULE_REFERENCES,
];

// Count total lessons
const totalLessons = MODULES.reduce(
  (sum, mod) => sum + mod.lessons.length,
  0,
);

const course = {
  _id: "course-anchor-fundamentals",
  _type: "course",
  courseId: "anchor-fundamentals",
  title: "Anchor Framework",
  slug: { _type: "slug", current: "anchor-fundamentals" },
  description:
    "Complete guide to building Solana programs with Anchor — from installation to production deployment. Follows the official Anchor documentation structure covering program structure, PDAs, CPIs, client libraries, testing, token interactions, and security best practices.",
  difficulty: 2,
  lessonCount: totalLessons,
  xpPerLesson: 30,
  trackId: 2,
  trackLevel: 1,
  isActive: true,
  isPublished: true,
  prerequisite: null,
  totalCompletions: 0,
  creatorRewardXp: totalLessons * 30,
  duration: `${Math.ceil(totalLessons * 0.4)} hours`,
  creator: "Superteam Academy",
  whatYouLearn: [
    "Install and configure Anchor CLI for Solana development",
    "Understand Anchor program structure: declare_id!, #[program], #[derive(Accounts)], #[account]",
    "Work with Program Derived Addresses (PDAs) and account constraints",
    "Implement Cross Program Invocations (CPIs) with PDA signers",
    "Use TypeScript and Rust client libraries to interact with programs",
    "Test programs with LiteSVM and Mollusk",
    "Implement custom errors, events, zero-copy accounts, and declare_program",
    "Create and manage SPL tokens and Token-2022 extensions in Anchor",
    "Apply security best practices and understand Sealevel attacks",
    "Deploy verifiable builds to devnet and mainnet",
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
  console.log("Pushing Anchor Framework course to Sanity...");
  console.log(`  Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`  Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}`);
  console.log(`  Total modules: ${MODULES.length}`);
  console.log(`  Total lessons: ${totalLessons}`);
  console.log(`  Total XP: ${totalLessons * 30}`);

  await client.createOrReplace(course);
  console.log("\nDone! Course pushed successfully.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
