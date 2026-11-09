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
 * - free: nothing landed and nothing is landing. By default a live attempt
 *   the cluster has never seen was abandoned (a sponsored transaction the
 *   learner never submitted): it is superseded so the slot can be used again
 *   at once. If it lands later, the next check finds it and the slot counts as
 *   used.
 *
 * With `unseenIsInFlight`, for transactions the server broadcast itself right
 * after reserving, an unseen attempt may still land, so it holds the slot
 * until settlement expires it past its last valid block height (or it is
 * marked failed when the node refused it).
 *
 * `emit` sends the settled events; the caller decides when they go out.
 */
export async function slotState(
  rows: SponsorshipRow[],
  connection: Parameters<typeof defaultSettleDeps>[0],
  emit: (event: ServerEvent) => Promise<void>,
  options: { unseenIsInFlight?: boolean } = {}
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
  if (
    options.unseenIsInFlight &&
    open.some((r) => outcomeOf(r.signature) === "unseen")
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
