/**
 * Sanity Seed Data Import Script
 *
 * Usage: node sanity/seed/import.mjs
 *
 * Reads all JSON seed files and creates/replaces documents in Sanity
 * using the mutations API via @sanity/client.
 *
 * Requires env vars (reads from apps/web/.env.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

// Load env vars from apps/web/.env.local
function loadEnv() {
  const envPath = resolve(rootDir, "apps/web/.env.local");
  if (!existsSync(envPath)) {
    console.error("Missing apps/web/.env.local — cannot read Sanity credentials.");
    process.exit(1);
  }
  const envContent = readFileSync(envPath, "utf-8");
  const vars = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    vars[key] = value;
  }
  return vars;
}

const env = loadEnv();
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = env.SANITY_API_TOKEN;

if (!projectId || projectId === "placeholder") {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set or is 'placeholder'.");
  process.exit(1);
}
if (!token) {
  console.error("SANITY_API_TOKEN is not set.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Order matters: referenced docs must be created before referencing docs
const seedFiles = [
  "instructor.json",
  "achievements.json",
  "quests.json",
  "lessons.json",
  "modules.json",
  "course.json",
  "learningPath.json",
];

async function importSeedData() {
  console.log(`Importing seed data into Sanity project "${projectId}", dataset "${dataset}"...`);
  console.log();

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const file of seedFiles) {
    const filePath = resolve(__dirname, file);
    if (!existsSync(filePath)) {
      console.log(`  [SKIP] ${file} — file not found`);
      continue;
    }

    const documents = JSON.parse(readFileSync(filePath, "utf-8"));
    console.log(`  [FILE] ${file} — ${documents.length} document(s)`);

    for (const doc of documents) {
      try {
        // Use createOrReplace so the script is idempotent
        await client.createOrReplace(doc);
        console.log(`    [OK] ${doc._type}/${doc._id}`);
        totalCreated++;
      } catch (err) {
        console.error(`    [ERR] ${doc._type}/${doc._id}: ${err.message}`);
      }
    }
  }

  console.log();
  console.log(`Done. Created/replaced: ${totalCreated}, Skipped/errored: ${totalSkipped}`);
}

// Verify connection first
async function verifyConnection() {
  try {
    const result = await client.fetch('*[_type == "course"][0..0]{_id}');
    console.log(`Connected to Sanity. Existing courses: ${result.length > 0 ? "yes" : "none"}`);
    return true;
  } catch (err) {
    console.error(`Failed to connect to Sanity: ${err.message}`);
    return false;
  }
}

async function main() {
  const connected = await verifyConnection();
  if (!connected) process.exit(1);

  await importSeedData();

  // Verify by fetching all documents
  console.log("\nVerification — querying imported data:");
  const types = ["instructor", "lesson", "module", "course", "learningPath", "achievement", "quest"];
  for (const type of types) {
    const count = await client.fetch(`count(*[_type == "${type}"])`);
    console.log(`  ${type}: ${count} document(s)`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
