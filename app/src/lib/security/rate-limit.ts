import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { rate_limits } from "@/lib/db/schema";

export type rate_limit_config = {
  key: string;
  window_ms: number;
  max: number;
};

export type rate_limit_result = {
  allowed: boolean;
  retry_after_ms?: number;
};

export async function check_rate_limit(config: rate_limit_config): Promise<rate_limit_result> {
  const { key, window_ms, max } = config;
  const now = new Date();
  const window_start_cutoff = new Date(now.getTime() - window_ms);

  const [row] = await db
    .select()
    .from(rate_limits)
    .where(and(eq(rate_limits.key, key), gt(rate_limits.window_start, window_start_cutoff)))
    .limit(1);

  if (!row) {
    await db.insert(rate_limits).values({
      key,
      window_start: now,
      count: 1,
    });
    return { allowed: true };
  }

  if (row.count >= max) {
    const retry_after_ms = row.window_start.getTime() + window_ms - now.getTime();
    return {
      allowed: false,
      retry_after_ms: Math.max(0, retry_after_ms),
    };
  }

  await db
    .update(rate_limits)
    .set({ count: row.count + 1 })
    .where(eq(rate_limits.id, row.id));

  return { allowed: true };
}

