/**
 * The Dynamic client singleton, plus the one extension this platform registers.
 *
 * ## Why the headless SDK
 *
 * This replaced `@dynamic-labs/sdk-react-core`, which Dynamic's own docs mark
 * legacy ("For new React apps, we recommend the JavaScript SDK with React
 * Hooks"). Two concrete reasons, not tidiness:
 *
 * 1. The legacy SDK ships its own modal, and that modal is a WALLET PICKER. A
 *    learner who arrives with no wallet — the entire reason this path exists —
 *    was shown a list of 159 wallets to install, MetaMask included. There is no
 *    setting that removes it; the UI is the product. Headless means we render
 *    our own email form and no picker can appear.
 * 2. It was ~11MB across 4,302 files behind one barrel export, and the direct
 *    cause of the production build OOM that forced
 *    `NODE_OPTIONS=--max-old-space-size=8192` onto Vercel.
 *
 * ## Solana embedded wallets ONLY
 *
 * `addWaasSolanaExtension` (from the `/waas` subpath) is deliberate, and is the
 * structural fix for the wallet picker rather than a cosmetic one. The default
 * `addSolanaExtension` bundles external-wallet DISCOVERY as well; the WaaS-only
 * extension carries none of it, so there is no code path that can enumerate
 * injected wallets. External wallets are already served by wallet-adapter on the
 * "Connect Solana Wallet" button — Dynamic's job here is strictly
 * "email in, embedded Solana wallet out".
 *
 * ## SSR
 *
 * `metadata.universalLink` is `NEXT_PUBLIC_APP_URL` rather than
 * `window.location.origin` as the docs suggest: this module is imported by a
 * client component, and Next still evaluates those on the server during SSR,
 * where `window` is undefined. The configured app URL is also the more correct
 * value — it is stable across preview deployments and localhost.
 *
 * The client IS constructed during SSR, deliberately. It was verified to
 * construct with no `window` present, and doing so keeps the React tree the
 * same shape on the server and after hydration — the alternative (mounting the
 * providers only in the browser) changes the tree shape on hydration and
 * remounts the entire app subtree beneath it.
 *
 * What must NOT happen on the server is `initializeClient()`: that is the
 * network call and the only thing that gives the client per-user state. It is
 * browser-gated below, so the server-side instance stays an inert config
 * object shared across requests, holding nothing about any learner.
 */

import {
  createDynamicClient,
  initializeClient,
  type DynamicClient,
} from "@dynamic-labs-sdk/client";
import { addWaasSolanaExtension } from "@dynamic-labs-sdk/solana/waas";
import { env } from "@/lib/env";
import { getDynamicEnvironmentId } from "@/lib/dynamic/config";

let client: DynamicClient | null = null;
let initialised = false;

/**
 * The process-wide Dynamic client, created on first use.
 *
 * Returns `null` when the feature is off (no environment id). That is normal,
 * not an error: callers must render the non-Dynamic path, exactly as they did
 * when the gate was unset.
 */
export function getDynamicClient(): DynamicClient | null {
  const environmentId = getDynamicEnvironmentId();
  if (!environmentId) return null;

  if (!client) {
    client = createDynamicClient({
      environmentId,
      // Manual init so the network call happens under our control — in the
      // browser only — rather than as an import side effect on every render.
      autoInitialize: false,
      metadata: {
        name: "Superteam Academy",
        universalLink: env.NEXT_PUBLIC_APP_URL,
      },
    });

    // Must be registered before initialisation completes, and takes no
    // arguments — it attaches to the client created above.
    addWaasSolanaExtension();
  }

  // Browser only: see the SSR note above. `initializeClient` is idempotent
  // once the client reports a status other than uninitialised, but the guard
  // is on `initialised` here so a re-render never re-enters it.
  if (typeof window !== "undefined" && !initialised) {
    initialised = true;
    void initializeClient();
  }

  return client;
}
