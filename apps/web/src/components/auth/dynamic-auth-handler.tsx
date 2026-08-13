"use client";

import { useEffect, useRef } from "react";
import {
  signMessage,
  completeDeviceRegistration,
  detectDeviceRegistrationRedirect,
  getDeviceRegistrationTokenFromUrl,
} from "@dynamic-labs-sdk/client";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";
import { useUser, useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import type { SolanaWalletAccount } from "@/lib/dynamic/solana";
import { createClient } from "@/lib/supabase/client";
import { runWalletSiws } from "@/lib/wallet/siws";
import { toMessageSigner } from "@/lib/dynamic/siws";

/**
 * Everything that has to happen around a Dynamic login, with no UI of its own.
 *
 * Three jobs, in the order they occur:
 *
 * 1. **Device registration.** Completing the emailed link is not optional —
 *    Dynamic requires device registration for every headless integration, and
 *    a user who is mid-registration is blocked until the redirect is consumed.
 *    It runs first, and on every mount, because the learner arrives back on an
 *    arbitrary page with the token in the URL.
 * 2. **Embedded wallet creation.** Unlike the legacy SDK's modal, the headless
 *    SDK does NOT create a wallet on sign-in; the account exists with no wallet
 *    until asked. Skipping this is why a learner would authenticate and then
 *    have nothing to enrol with.
 * 3. **The Supabase bridge.** Dynamic owns the *wallet* login; Supabase stays
 *    the *account* identity. Once a Solana address exists this signs a
 *    server-issued SIWS nonce with it and exchanges that for a session or a
 *    wallet link — through the very same routes the wallet-adapter path uses,
 *    so both ways in converge on one account model rather than two.
 *
 * Mounted at the layout level alongside `WalletAuthHandler`, which does job 3
 * for wallet-adapter wallets.
 */
export function DynamicAuthHandler() {
  const { data: user } = useUser();
  const { data: walletAccounts = [] } = useGetWalletAccounts();

  // Survives re-renders AND the address arriving more than once (restored
  // session, then a create event) — without it a learner could be asked to
  // sign the same nonce twice.
  const handledAddress = useRef<string | null>(null);
  const creatingWallet = useRef(false);

  // 1. Device registration redirect.
  useEffect(() => {
    const url = window.location.href;
    if (!detectDeviceRegistrationRedirect({ url })) return;

    void (async () => {
      try {
        const deviceToken = getDeviceRegistrationTokenFromUrl({ url });
        await completeDeviceRegistration({ deviceToken });

        // Strip the token so a refresh, or a shared link, cannot replay it.
        const clean = new URL(window.location.href);
        clean.search = "";
        window.history.replaceState({}, "", clean.toString());
      } catch {
        // Registration stays incomplete; the learner can retry from the email.
      }
    })();
  }, []);

  // 2. Create the embedded Solana wallet once the learner is authenticated.
  useEffect(() => {
    if (!user || creatingWallet.current) return;

    const missing = getChainsMissingWaasWalletAccounts();
    if (missing.length === 0) return;

    creatingWallet.current = true;
    void (async () => {
      try {
        await createWaasWalletAccounts({ chains: missing });
      } catch {
        // Leave the flag set: a failed creation that retries on every render
        // would hammer the MPC service. The learner can retry by signing in
        // again, which remounts this handler.
      }
    })();
  }, [user]);

  // 3. Bridge the wallet to a Supabase account.
  useEffect(() => {
    // A local predicate rather than the SDK's `isSolanaWalletAccount`: the
    // pnpm graph holds two client instances (differing peer sets), so the
    // SDK guard's parameter type and this hook's account type are nominally
    // different and the guard does not compose with `find` here. The chain
    // discriminant is the same check the guard performs.
    const solanaAccount = walletAccounts.find(
      (a): a is SolanaWalletAccount => a.chain === "SOL"
    );
    if (!solanaAccount) return;

    const address = solanaAccount.address;
    if (!address || handledAddress.current === address) return;
    handledAddress.current = address;

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        // Already linked: nothing to do. Re-running would re-prompt for a
        // signature on every page load.
        if (supabaseUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("wallet_address")
            .eq("id", supabaseUser.id)
            .maybeSingle();
          if (profile?.wallet_address) return;
        }

        const outcome = await runWalletSiws(
          toMessageSigner(solanaAccount, signMessage),
          address,
          Boolean(supabaseUser)
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
  }, [walletAccounts]);

  return null;
}
