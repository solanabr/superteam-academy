import "server-only";
import { serverEnv } from "@/lib/env.server";

/**
 * Fire-and-forget ping to the optional moderation webhook (`MODERATION_WEBHOOK_URL`).
 * Sends both `text` (Slack incoming webhooks) and `content` (Discord) so either
 * platform renders the message. Never throws — a failed/absent webhook must not
 * affect the flag request that triggered it.
 */
export async function notifyModeration(message: string): Promise<void> {
  const url = serverEnv.MODERATION_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, content: message }),
    });
  } catch (err) {
    console.warn(
      "[moderation] webhook failed:",
      err instanceof Error ? err.message : err
    );
  }
}
