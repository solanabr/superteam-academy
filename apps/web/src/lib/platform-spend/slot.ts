import "server-only";

import { supersedeSponsoredEnroll, type SponsorshipRow } from "./ledger";
import { defaultSettleDeps, settleRows, type SettleOutcome } from "./settle";
import type { ServerEvent } from "./events";

export type SlotState = "free" | "used" | "in_flight";

/**
 * Where a once-per slot stands, from every row for its key, settled inline in
 * one pass (one signature-status lookup):
 * - used: a transaction for it landed, including an abandoned one that landed
 *   after all (`superseded_landed`), even if the cron has not seen it yet;
 * - in flight: the live attempt, or an abandoned one, is landing right now;
 * - free: nothing landed and nothing is landing. A live attempt the cluster
 *   has never seen was abandoned (a cancelled or failed signature): it is
 *   superseded so the slot can be used again at once. If it lands later, the
 *   next check finds it and the slot counts as used.
 *
 * `emit` sends the settled events; the caller decides when they go out.
 */
export async function slotState(
  rows: SponsorshipRow[],
  connection: Parameters<typeof defaultSettleDeps>[0],
  emit: (event: ServerEvent) => Promise<void>
): Promise<SlotState> {
  const used = (status: string) =>
    status === "confirmed" || status === "superseded_landed";
  if (rows.some((r) => used(r.status))) return "used";

  const open = rows.filter(
    (r) => r.status === "pending" || r.status === "superseded"
  );
  if (open.length === 0) return "free";

  const settled = await settleRows(open, {
    ...defaultSettleDeps(connection),
    emit,
  });
  const outcomeOf = (signature: string): SettleOutcome =>
    settled.get(signature) ?? "pending";

  if (open.some((r) => used(outcomeOf(r.signature)))) return "used";
  // Seen on-chain but not final yet: a live or an abandoned attempt.
  if (
    open.some((r) => {
      const outcome = outcomeOf(r.signature);
      return outcome === "pending" || outcome === "superseded";
    })
  ) {
    return "in_flight";
  }
  const abandoned = open.find(
    (r) => r.status === "pending" && outcomeOf(r.signature) === "unseen"
  );
  if (abandoned && !(await supersedeSponsoredEnroll(abandoned.signature))) {
    return "in_flight";
  }
  return "free";
}
