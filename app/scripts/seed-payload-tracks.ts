/**
 * Seeds the Tracks collection in Payload CMS from the hardcoded TRACKS constant.
 *
 * Usage: pnpm db:seed-tracks
 */

import { getPayload } from "../src/lib/payload";
import { TRACKS } from "../src/lib/constants";

async function seedTracks() {
  const payload = await getPayload();

  console.log("Seeding tracks into Payload CMS...\n");

  for (const [id, track] of Object.entries(TRACKS)) {
    const trackId = Number(id);
    const existing = await payload.find({
      collection: "tracks",
      where: { trackId: { equals: trackId } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(
        `  [skip] Track ${trackId} (${track.display}) already exists`,
      );
      continue;
    }

    await payload.create({
      collection: "tracks",
      data: {
        trackId,
        name: track.name,
        display: track.display,
        short: track.short,
        color: track.color,
        icon: track.icon,
      },
    });
    console.log(`  [created] Track ${trackId}: ${track.display}`);
  }

  console.log("\nDone! Seeded tracks into Payload.");
  process.exit(0);
}

seedTracks().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
