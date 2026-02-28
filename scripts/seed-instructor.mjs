/**
 * Creates an instructor document in Sanity and links it to all courses.
 * Usage: node scripts/seed-instructor.mjs
 *
 * Set SANITY_TOKEN env var or pass it as SANITY_TOKEN=... node scripts/seed-instructor.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../app/.env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Update this to match your wallet address
const WALLET_ADDRESS = "8RER7VKxDjHgruqJPgQhKo54cUTTsdX5iLoiKRTjsB1f";
const INSTRUCTOR_NAME = "Superteam Academy";

async function run() {
  console.log("Creating instructor document...");

  // Check if instructor already exists
  const existing = await client.fetch(
    `*[_type == "instructor" && walletAddress == $wallet][0]._id`,
    { wallet: WALLET_ADDRESS }
  );

  let instructorId;
  if (existing) {
    console.log(`Instructor already exists: ${existing}`);
    instructorId = existing;
  } else {
    const instructor = await client.create({
      _type: "instructor",
      name: INSTRUCTOR_NAME,
      walletAddress: WALLET_ADDRESS,
      bio: "Building on Solana. Superteam Academy founder.",
    });
    instructorId = instructor._id;
    console.log(`Created instructor: ${instructorId}`);
  }

  // Fetch all courses
  const courses = await client.fetch(
    `*[_type == "course" && !(_id in path("drafts.**"))]{_id, title}`
  );

  console.log(`Linking instructor to ${courses.length} courses...`);

  for (const course of courses) {
    await client.patch(course._id).set({
      instructor: { _type: "reference", _ref: instructorId },
    }).commit();
    console.log(`  ✓ ${course.title}`);
  }

  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
