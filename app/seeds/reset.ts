/**
 * Full reset: drops Payload schema, resets Prisma migrations, and re-seeds.
 *
 * Usage: npx tsx --env-file .env seeds/reset.ts
 */
import { execSync } from "node:child_process";
import { Pool } from "pg";

const appDir = new URL("..", import.meta.url).pathname;

async function main() {
  const start = Date.now();
  const dbUrl =
    process.env.DATABASE_URL || "postgresql://localhost:5432/superteam_academy";

  console.log("🔄 Full reset starting...\n");

  // 1. Drop Payload schema (Payload uses a separate "payload" schema in Postgres)
  console.log("  [1/3] Dropping Payload schema...");
  const pool = new Pool({ connectionString: dbUrl });
  await pool.query("DROP SCHEMA IF EXISTS payload CASCADE");
  await pool.end();
  console.log("  ✓ Payload schema dropped\n");

  // 2. Reset Prisma (drops public schema tables, re-runs all migrations)
  console.log("  [2/3] Resetting Prisma database...");
  execSync("npx prisma migrate reset --force", {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log("  ✓ Prisma reset complete\n");

  // 3. Run seed script
  console.log("  [3/3] Running seed...");
  execSync("npx tsx --env-file .env seeds/seed.ts", {
    cwd: appDir,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n🔄 Full reset complete in ${elapsed}s!`);
}

main().catch((e) => {
  console.error("Reset failed:", e);
  process.exit(1);
});
