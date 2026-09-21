/**
 * Read-only report on what the fixed drain WOULD do to the current
 * `pending_onchain_actions` backlog (#1247).
 *
 * Runs the real selection policy (lib/solana/queue-selection) against the live
 * table and buckets every unresolved row by the outcome the drain would reach,
 * without an RPC call, a send or a single write. `--dry-run` is required, so
 * the script cannot be turned into a writer by a future edit that forgets to
 * check it.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     pnpm tsx scripts/onchain-queue-dry-run.ts --dry-run
 *
 * The outcome for an on-chain row depends on chain state this script does not
 * read, so a row that would be attempted is reported as "would attempt" rather
 * than guessed at. The buckets it CAN decide are the ones the fix is about:
 * selected vs starved by the cap, held by backoff, past the retry budget,
 * terminal-already-satisfied, and blocked on a missing wallet.
 */
import { createClient } from "@supabase/supabase-js";
import {
  DRAIN_LIMIT,
  MAX_RETRIES,
  backoffMs,
  isDueForRetry,
  selectDueRows,
  type DrainableRow,
} from "../apps/web/src/lib/queue/selection";
import { isAlreadySatisfied } from "../apps/web/src/lib/solana/queue-errors";

const DRY_RUN = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  if (!DRY_RUN) {
    console.error(
      "refusing to run without --dry-run (this script is read-only by contract)"
    );
    process.exit(2);
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required"
    );
    process.exit(2);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("pending_onchain_actions")
    .select("*")
    .is("resolved_at", null)
    .order("failed_at", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DrainableRow[];
  const now = Date.now();

  // Which learners have a linked wallet — the only thing Pass 2 needs beyond
  // the row itself, and a silent no-op before this change.
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, wallet_address")
    .in("id", userIds as string[]);
  const walletFor = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      p.wallet_address as string | null,
    ])
  );

  const counts: Record<string, number> = {};
  const bump = (key: string) => {
    counts[key] = (counts[key] ?? 0) + 1;
  };

  const selected = selectDueRows(rows, { now, limit: DRAIN_LIMIT });
  const selectedIds = new Set(selected.map((r) => r.id));

  for (const row of rows) {
    if ((row.retry_count ?? 0) >= MAX_RETRIES) {
      bump("skip: past retry budget (needs an operator requeue)");
      continue;
    }
    if (!isDueForRetry(row, now)) {
      const dueIn = Math.round(
        (Date.parse(row.last_attempt_at ?? "") +
          backoffMs(row.retry_count) -
          now) /
          60000
      );
      bump(`hold: backoff (due in ~${dueIn}m)`);
      continue;
    }
    // Reported before the cap, because "this row will never succeed and the
    // drain now resolves it" is the fact worth seeing for the whole backlog,
    // not just for the 25 rows this particular run would take.
    const terminal = isAlreadySatisfied({ message: row.last_error ?? "" });
    if (terminal) {
      bump(`resolve: already satisfied on-chain (${terminal.name})`);
      continue;
    }
    if (!selectedIds.has(row.id)) {
      bump("queued: due but over this run's cap (next tick)");
      continue;
    }
    if (row.action_type !== "quest_xp" && !walletFor.get(row.user_id ?? "")) {
      bump("skip: no linked wallet (nothing to mint to)");
      continue;
    }
    bump(`attempt: ${row.action_type}`);
  }

  console.log(`pending_onchain_actions — unresolved rows: ${rows.length}`);
  console.log(`learners affected: ${userIds.length}`);
  console.log(
    `this run would select ${selected.length} (cap ${DRAIN_LIMIT}), oldest first`
  );
  if (selected.length > 0) {
    console.log(
      `oldest selected: ${selected[0].action_type} ${selected[0].reference_id} (failed_at ${selected[0].failed_at})`
    );
  }
  console.log("");
  console.log("outcome per row:");
  for (const [outcome, n] of Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${String(n).padStart(4)}  ${outcome}`);
  }
  console.log("");
  console.log("by action_type:");
  const byType: Record<string, number> = {};
  for (const row of rows)
    byType[row.action_type] = (byType[row.action_type] ?? 0) + 1;
  for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${type}`);
  }
  console.log("");
  console.log(
    `at ${DRAIN_LIMIT} rows per run every 15 minutes, the backlog clears in ~${
      Math.ceil(rows.length / DRAIN_LIMIT) * 15
    } minutes of cron time (barring genuine failures).`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
