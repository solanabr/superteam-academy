/**
 * Seeds the Difficulties collection in Payload CMS from the hardcoded DIFFICULTIES constant.
 *
 * Usage: pnpm db:seed-difficulties
 */

import { getPayload } from "../src/lib/payload";
import { DIFFICULTIES } from "../src/lib/constants";

async function seedDifficulties() {
  const payload = await getPayload();

  console.log("Seeding difficulties into Payload CMS...\n");

  for (const diff of DIFFICULTIES) {
    const existing = await payload.find({
      collection: "difficulties",
      where: { value: { equals: diff.value } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(`  [skip] ${diff.label} already exists`);
      continue;
    }

    await payload.create({
      collection: "difficulties",
      data: {
        value: diff.value,
        label: diff.label,
        color: diff.color,
        order: diff.order,
        defaultXp: diff.defaultXp,
      },
    });
    console.log(`  [created] ${diff.label} (${diff.value})`);
  }

  console.log("\nDone! Seeded difficulties into Payload.");
  process.exit(0);
}

seedDifficulties().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
