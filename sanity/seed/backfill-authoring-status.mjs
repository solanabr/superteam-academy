/**
 * Sanity Backfill — course.authoringStatus (issue #263)
 *
 * Sets authoringStatus = "approved" on every existing course document that does
 * not yet have the field. Legacy courses predate the teacher-authoring workflow
 * and must stay publicly visible, so they are backfilled to "approved".
 *
 * RUN MANUALLY, POST-DEPLOY, with a write token. This is NOT run automatically
 * and does NOT need to run before shipping: the public GROQ catalog filter is
 * lenient — `(authoringStatus == "approved" || !defined(authoringStatus))` — so
 * legacy docs remain visible even while their field is still undefined. This
 * script simply normalizes the data so every course carries an explicit status.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=<token> node sanity/seed/backfill-authoring-status.mjs
 *
 * Requires env vars (from apps/web/.env.local or the process environment):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET   (default: production)
 *   SANITY_API_WRITE_TOKEN       (a token with write access; NEVER hardcode it)
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

// Load env vars from apps/web/.env.local, falling back to process.env so the
// script also works in CI / one-off shells that export the vars directly.
function loadEnv() {
  const vars = { ...process.env };
  const envPath = resolve(rootDir, "apps/web/.env.local");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      // Do not let a blank .env.local line clobber a real process.env value.
      if (value !== "") vars[key] = value;
    }
  }
  return vars;
}

const env = loadEnv();
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = env.SANITY_API_WRITE_TOKEN;

if (!projectId || projectId === "placeholder") {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set or is 'placeholder'.");
  process.exit(1);
}
if (!token) {
  console.error(
    "SANITY_API_WRITE_TOKEN is not set. Provide a write token via env; do not hardcode it."
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function backfill() {
  console.log(
    `Backfilling course.authoringStatus in project "${projectId}", dataset "${dataset}"...`
  );

  // Every course (incl. drafts) still missing the field.
  const ids = await client.fetch(
    `*[_type == "course" && !defined(authoringStatus)]._id`
  );

  if (!ids.length) {
    console.log("No courses need backfilling — all already have authoringStatus.");
    return;
  }

  console.log(`Found ${ids.length} course(s) without authoringStatus. Patching...`);

  let patched = 0;
  // Chain patches in a single transaction so the backfill is atomic.
  let tx = client.transaction();
  for (const id of ids) {
    // setIfMissing is defensive: never overwrite a status set in the meantime.
    tx = tx.patch(id, (p) => p.setIfMissing({ authoringStatus: "approved" }));
  }

  try {
    await tx.commit({ visibility: "async" });
    patched = ids.length;
  } catch (err) {
    console.error(`Failed to commit backfill transaction: ${err.message}`);
    process.exit(1);
  }

  console.log(`Done. Patched ${patched} course document(s) -> authoringStatus = "approved".`);
}

backfill().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
