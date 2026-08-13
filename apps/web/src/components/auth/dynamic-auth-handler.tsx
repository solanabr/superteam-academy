"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  signMessage,
  clearSocialRedirectParams,
  completeDeviceRegistration,
  completeSocialRedirect,
  detectDeviceRegistrationRedirect,
  detectSocialRedirectUrl,
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
import { logoutDynamic } from "@/lib/dynamic/client";
import { toMessageSigner } from "@/lib/dynamic/siws";
import { bridgeDynamicSession } from "@/lib/dynamic/social";
import { dispatchToast } from "@/components/ui/toast-container";

/**
 * Everything that has to happen around a Dynamic login, with no UI of its own.
 *
 * Four jobs, in the order they occur:
 *
 * 0. **The social redirect return.** Social sign-in on web is a full-page
 *    navigation (there is no popup variant — see `lib/dynamic/social.ts`), so
 *    the button that started it is long gone by the time Google redirects
 *    back. Finishing the handshake and exchanging the resulting Dynamic JWT
 *    for a Supabase session has to happen from something mounted on every
 *    page, which is this.
 * 1. **Device registration.** OPTIONAL — off by default and only active when
 *    the dashboard toggle enables it (per Dynamic's docs; an earlier reading
 *    here claimed it was required). When it IS on, a returning learner on a
 *    new device is blocked until the emailed link's redirect is consumed, so
 *    the consumer runs first, on every mount — the learner arrives back on an
 *    arbitrary page with the token in the URL. With the toggle off this
 *    effect never matches and is inert.
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
/**
 * The social-return handshake runs AT MOST ONCE per page load:
 * `completeSocialRedirect` spends a one-time OAuth code, so a second
 * invocation — StrictMode's dev double-effect, or any remount while the
 * callback params are still in the URL — replays a spent code, throws, and
 * the failure path then logs out the session the first invocation just
 * established (observed live: a 200 bridge immediately followed by an aborted
 * duplicate, leaving the learner "not signed in" until a second attempt).
 *
 * A PROMISE, not a boolean: "claimed" and "resolved" are different states. A
 * duplicate that treated claimed-as-resolved would release job 3's guard while
 * the real handshake is still in flight — the fork race all over again. Every
 * invocation awaits the SAME promise and applies its settled outcome;
 * `"hold"` means a reload is imminent and the guard must stay up.
 * Module scope, not a ref: a ref dies with its fiber, and both success
 * (hard reload) and failure (params stripped) end this page load's story.
 */
let socialReturnOutcome: Promise<"release" | "hold"> | null = null;

export function DynamicAuthHandler() {
  const t = useTranslations("auth");
  const { data: user } = useUser();
  const { data: walletAccounts = [] } = useGetWalletAccounts();

  // Survives re-renders AND the address arriving more than once (restored
  // session, then a create event) — without it a learner could be asked to
  // sign the same nonce twice.
  const handledAddress = useRef<string | null>(null);
  const creatingWallet = useRef(false);
  // Held for the whole social return, including the JWT bridge. Job 3 must not
  // start while it is held: with no Supabase session visible yet it would take
  // the "sign in with this wallet" branch and mint a SECOND, wallet-shaped
  // account — the exact fork /api/auth/dynamic exists to prevent.
  //
  // State, not a ref: initializing to `true` claims the guard from the very
  // first render (before job 0's async detection can yield), and releasing it
  // re-runs job 3 — a ref flip would not, so a wallet account that arrived
  // while the guard was held would otherwise never get its SIWS turn until
  // some future reload.
  const [bridgingSocial, setBridgingSocial] = useState(true);

  // 0. Social redirect return.
  useEffect(() => {
    const url = new URL(window.location.href);

    void (async () => {
      // `??=` runs synchronously before this body's first await, so only the
      // first invocation starts the handshake; StrictMode's duplicate and any
      // later remount await the same promise instead of re-running it.
      socialReturnOutcome ??= (async (): Promise<"release" | "hold"> => {
        try {
          if (!(await detectSocialRedirectUrl({ url }))) return "release";

          await completeSocialRedirect({ url });
          // Before the params are stripped a refresh would replay the callback
          // code, which Dynamic has already spent.
          clearSocialRedirectParams();

          // An existing Supabase session means this was a link, not a sign-in;
          // minting a session here could land the learner in a different
          // account than the one they are already using. Job 3 links the fresh
          // embedded wallet to that account instead.
          const supabase = createClient();
          const {
            data: { user: supabaseUser },
          } = await supabase.auth.getUser();
          if (supabaseUser) return "release";

          const outcome = await bridgeDynamicSession();
          if (outcome.ok) {
            // Same hard reload as the SIWS bridge: the Supabase client in this
            // tab was built anonymous and only re-reads the cookies on boot.
            // The guard stays up — the reload is not instantaneous and job 3
            // must not get a turn in the interval.
            window.location.reload();
            return "hold";
          }

          // Authenticated to Dynamic with no Supabase session is a dead end —
          // every subsequent page load would retry a bridge that has already
          // been refused. End the Dynamic session so the learner is plainly
          // signed out and can pick another way in.
          dispatchToast(t(outcome.errorKey), "error");
          await logoutDynamic();
          return "release";
        } catch (err) {
          console.error("[DynamicAuthHandler] social redirect failed:", err);
          dispatchToast(t("googleBridgeFailed"), "error");
          await logoutDynamic();
          return "release";
        }
      })();

      if ((await socialReturnOutcome) === "release") setBridgingSocial(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (bridgingSocial) return;

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
  }, [walletAccounts, bridgingSocial]);

  return null;
}
