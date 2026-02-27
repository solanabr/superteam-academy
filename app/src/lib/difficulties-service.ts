import { DIFFICULTIES } from "@/lib/constants";
import type { DifficultyMeta } from "@/lib/constants";

/**
 * Fetch all difficulties from Payload CMS, falling back to the hardcoded DIFFICULTIES constant.
 * Server-side only.
 */
export async function getAllDifficulties(): Promise<DifficultyMeta[]> {
  try {
    const { getPayload } = await import("@/lib/payload");
    const payload = await getPayload();
    const result = await payload.find({
      collection: "difficulties",
      sort: "order",
      limit: 100,
    });
    if (result.docs.length > 0) {
      return result.docs.map((doc) => ({
        value: doc.value as string,
        label: doc.label as string,
        color: doc.color as string,
        order: doc.order as number,
        defaultXp: doc.defaultXp as number,
      }));
    }
  } catch {
    // Payload not configured — fall through to constant
  }
  return DIFFICULTIES;
}
