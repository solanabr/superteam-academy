"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { runPhantomSiws } from "@/lib/phantom/siws";
import { usePhantomConnect } from "@/components/auth/phantom-connect-provider";

/**
 * Bridges a connected Phantom embedded wallet to the Supabase account (#986).
 *
 * Mounted at the layout level, alongside `WalletAuthHandler` — which does the
 * same job for wallet-adapter wallets. Phantom returns from its redirect with a
 * connected address and no Supabase session, and this is what turns that into
 * an account.
 */
export function PhantomAuthHandler() {
  const t = useTranslations("auth");
  const { enabled, address, status } = usePhantomConnect();
  // Survives re-renders AND the address arriving twice (autoConnect on mount,
  // then the connect event) — without it a learner could be prompted to sign
  // the same nonce twice.
  const handledAddress = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bridge = useCallback(
    async (walletAddress: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Already linked to this profile: nothing to do. Re-running would just
      // re-prompt for a signature on every page load.
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.wallet_address) return;
      }

      const outcome = await runPhantomSiws(
        {
          // The provider owns the SDK; re-derive the chain object here so this
          // component holds no SDK reference of its own.
          signMessage: async (message) => {
            const { createPhantomClient } =
              await import("@/lib/phantom/client");
            const sdk = createPhantomClient();
            if (!sdk) throw new Error("Phantom not configured");
            return sdk.solana.signMessage(message);
          },
        },
        walletAddress,
        Boolean(user)
      );

      if (outcome.ok) {
        // Provenance for the graduation card (#987): mark that THIS account's
        // wallet came from Phantom Connect. Deferred via localStorage because
        // on the fresh sign-in path the browser client has no session until
        // after the reload — a prefs UPDATE here would fail RLS. The marker is
        // flushed into prefs.walletProvider by the mount effect below.
        localStorage.setItem("phantomEmbeddedPending", "1");
        // Hard reload so the Supabase client re-initialises with the cookies the
        // route just set — a soft navigation keeps the anonymous client.
        window.location.reload();
        return;
      }

      // Every failure clears the ref (#994 review): it exists to stop the SAME
      // successful address being bridged twice (autoConnect + the connect
      // event), not to make failure permanent. Without this, a declined
      // signature blocked every retry until a full page reload — the effect
      // deps don't change on a retry click, and even when they did, the stale
      // ref swallowed it.
      handledAddress.current = null;

      if (outcome.reason === "declined") return; // Ordinary choice, stay quiet.

      // Copy is picked from the SITUATION KEY the server returns, never from
      // which route was called (#994 review — the mode-based ternary shipped
      // inverted precisely because the route is a bad proxy for the situation):
      //   walletAlreadyLinked  → this wallet belongs to ANOTHER account
      //   differentWalletLinked → THIS account already has a different wallet
      if (outcome.reason === "walletAlreadyLinked") {
        setError(t("phantomWalletTaken"));
        return;
      }
      if (outcome.reason === "differentWalletLinked") {
        setError(t("phantomAccountHasWallet"));
        return;
      }
      setError(
        outcome.reason === "accountDeleted"
          ? t("accountDeleted")
          : t("phantomSignInFailed")
      );
    },
    [t]
  );

  useEffect(() => {
    if (!enabled || status !== "connected" || !address) return;
    if (handledAddress.current === address) return;
    handledAddress.current = address;
    void bridge(address);
  }, [enabled, status, address, bridge]);

  // Flush the deferred provenance marker (#987) into prefs.walletProvider once
  // a session exists. Merge-write so sibling prefs keys (nextLesson,
  // nameRevealSeen, …) survive; the marker is cleared only after a successful
  // write, so a failed flush simply retries on the next page load.
  useEffect(() => {
    if (localStorage.getItem("phantomEmbeddedPending") !== "1") return;
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", user.id)
        .maybeSingle();
      // Without a good read we cannot merge, and a blind write would clobber
      // sibling prefs keys — skip; the marker keeps it retrying.
      if (error || cancelled) return;
      const prior = data?.prefs;
      const prefs = {
        ...(typeof prior === "object" && prior !== null && !Array.isArray(prior)
          ? (prior as Record<string, unknown>)
          : {}),
        walletProvider: "phantom-embedded",
      };
      const { error: writeError } = await supabase
        .from("profiles")
        // Plain JSON object; the merged record lacks the index signature the
        // generated Json type wants, so cast at the boundary (same idiom as
        // name-reveal-dialog's prefs write).
        .update({ prefs: prefs as unknown as Json })
        .eq("id", user.id);
      if (!writeError) localStorage.removeItem("phantomEmbeddedPending");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-danger bg-card p-4 text-center text-sm text-danger shadow-card"
    >
      {error}
    </div>
  );
}
