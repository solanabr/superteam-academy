import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { WalletKind } from "@/lib/auth/wallet-kind";

/**
 * Record how an account's wallet was provisioned — first writer wins.
 *
 * ## Why first-writer-wins
 *
 * `walletKind` reaches the SIWS routes as a CLIENT-DECLARED field, because the
 * two routes serve both wallet sorts and the request itself carries nothing
 * that distinguishes them: an embedded wallet signs the very same SIWS message
 * an extension does. Believing a declaration forever would let an account flip
 * its own recovery path on demand.
 *
 * So the declaration is believed exactly once — while the column is still NULL
 * — and every later call is a no-op. Combined with the Dynamic bridge writing
 * `embedded` server-side before the embedded wallet is ever linked, the first
 * write for any account is the truthful one:
 *
 * | account                          | first write                      |
 * | -------------------------------- | -------------------------------- |
 * | Dynamic social sign-in (no wallet) | bridge → `embedded`            |
 * | SIWS with an extension           | wallet route → `external`        |
 * | extension user later bridging    | already `external`, untouched    |
 *
 * A user who lies (declares `embedded` from an extension) only mislabels their
 * OWN row, and the sole consequence is being offered Dynamic re-auth instead
 * of the connect modal. Nothing is authorised by this column.
 *
 * ## Why failures are swallowed
 *
 * This runs inside the two login chokepoints. It is a UX hint; sign-in is not.
 * A DB that has not had `20260824120000_wallet_kind.sql` applied yet would
 * otherwise turn every wallet login into a 500 — a deploy-ordering landmine
 * for a column nothing depends on. The write is best-effort by design.
 */
export async function recordWalletKind(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  declared: WalletKind | null
): Promise<void> {
  if (!declared) return;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("wallet_kind")
      .eq("id", userId)
      .single();

    if (error || data?.wallet_kind) return;

    await supabaseAdmin
      .from("profiles")
      .update({ wallet_kind: declared })
      .eq("id", userId);
  } catch {
    // See the docblock: never fail a login over a routing hint.
  }
}
