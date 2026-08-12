"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { getDynamicEnvironmentId } from "@/lib/dynamic/config";
import { DynamicAuthHandler } from "@/components/auth/dynamic-auth-handler";

/**
 * Dynamic embedded wallets for the whole app.
 *
 * Replaces Phantom Connect, which Portal never approved (#1017). Every learner
 * gets a real Solana wallet from a Google sign-in, so there is no longer a class
 * of learner who can hold an account but not enrol — which is what the
 * per-course offline workaround existed to paper over.
 *
 * Solana-only by design: `SolanaWalletConnectors` is the sole connector, because
 * an EVM connector here would offer learners a wallet this platform cannot use
 * for anything.
 *
 * When the environment id is unset this renders its children untouched — no
 * provider, no SDK initialisation, no network call. That keeps the gate's
 * promise that an unconfigured build is simply a build without embedded wallets,
 * never a broken one, and leaves SIWS with an external wallet as the guaranteed
 * way in.
 */
export function DynamicWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const environmentId = getDynamicEnvironmentId();

  if (!environmentId) return <>{children}</>;

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      {/* Mounted INSIDE the provider, never beside it. The handler calls
          `useDynamicContext()`, which throws on the client when no provider is
          present — as a sibling it would crash every page in a build with no
          environment id, and only on hydration, so the build would look fine. */}
      <DynamicAuthHandler />
      {children}
    </DynamicContextProvider>
  );
}
