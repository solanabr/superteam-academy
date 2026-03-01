import { serve } from "@hono/node-server";
import cron from "node-cron";
import "dotenv/config";
import { createApp } from "@/app.js";
import { ensureCredentialCollectionsLoaded } from "@/academy/credential-collections-store.js";
import { syncLeaderboardFromUsers } from "@/jobs/sync-leaderboard.js";

async function main() {
  const db = process.env.DATABASE_URL?.trim();
  const pinata = process.env.PINATA_JWT?.trim();
  if (!db || !pinata) {
    console.error("DATABASE_URL and PINATA_JWT are required");
    process.exit(1);
  }

  await ensureCredentialCollectionsLoaded().catch((err) => {
    console.error("Failed to load credential collections:", err);
    process.exit(1);
  });

  await syncLeaderboardFromUsers().catch((err) => console.error("Initial leaderboard sync:", err));
  cron.schedule("0 * * * *", () => {
    syncLeaderboardFromUsers().catch((err) => console.error("Leaderboard cron:", err));
  });

  const app = createApp();
  const port = Number(process.env.PORT ?? 3001);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Academy backend listening on http://localhost:${info.port}`);
  });
}

main();
