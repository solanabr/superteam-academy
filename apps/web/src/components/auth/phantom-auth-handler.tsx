"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
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
        // Hard reload so the Supabase client re-initialises with the cookies the
        // route just set — a soft navigation keeps the anonymous client.
        window.location.reload();
        return;
      }

      if (outcome.reason === "declined") return; // Ordinary choice, stay quiet.

      // Same server key, two very different situations — a learner whose wallet
      // belongs to someone else needs different advice from one who simply
      // already has a wallet on this account.
      if (outcome.reason === "walletAlreadyLinked") {
        setError(
          outcome.mode === "link"
            ? t("phantomAccountHasWallet")
            : t("phantomWalletTaken")
        );
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
