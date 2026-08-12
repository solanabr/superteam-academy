"use client";

import { useEffect, useRef } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isSolanaWallet } from "@dynamic-labs/solana";
import { createClient } from "@/lib/supabase/client";
import { runWalletSiws } from "@/lib/wallet/siws";
import { toMessageSigner } from "@/lib/dynamic/siws";

/**
 * Bridges a connected Dynamic wallet to a Supabase account.
 *
 * Dynamic owns the *wallet* login (email or social); Supabase stays the
 * *account* identity. Once Dynamic hands us an address this signs a server-issued
 * SIWS nonce with it and exchanges that for either a session or a wallet link —
 * through the very same routes the wallet-adapter path uses, so both ways in
 * converge on one account model rather than two.
 *
 * Mounted at the layout level alongside `WalletAuthHandler`, which does the same
 * job for wallet-adapter wallets.
 */
export function DynamicAuthHandler() {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();
  // Survives re-renders AND the address arriving more than once (restored
  // session, then a connect event) — without it a learner could be asked to
  // sign the same nonce twice.
  const handledAddress = useRef<string | null>(null);

  useEffect(() => {
    if (!sdkHasLoaded) return;

    const wallet = primaryWallet;
    // Solana only: an EVM wallet has no address this platform can use, and
    // `signMessage` would produce a signature `/api/auth/wallet` cannot verify.
    if (!wallet || !isSolanaWallet(wallet)) return;

    const address = wallet.address;
    if (!address || handledAddress.current === address) return;
    handledAddress.current = address;

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Already linked: nothing to do. Re-running would re-prompt for a
        // signature on every page load.
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("wallet_address")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.wallet_address) return;
        }

        const outcome = await runWalletSiws(
          toMessageSigner(wallet),
          address,
          Boolean(user)
        );

        if (outcome.ok) {
          // Hard reload so the Supabase client re-initialises with the cookies
          // the route just set — a soft navigation keeps the anonymous client.
          window.location.reload();
          return;
        }

        // Every failure clears the guard so a learner who declined, or hit a
        // blip, can try again without reloading the page.
        handledAddress.current = null;
      } catch {
        handledAddress.current = null;
      }
    })();
  }, [sdkHasLoaded, primaryWallet]);

  return null;
}
