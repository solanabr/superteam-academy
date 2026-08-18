"use client";

import { useEffect } from "react";
import { useUser, useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";

/**
 * What the Dynamic session knows that the Supabase identity list doesn't.
 *
 * A learner who clicked "Continue with Google" through Dynamic has NO Supabase
 * google identity — the bridge creates an email-provider user — so the Account
 * tab's rows, read purely from Supabase, tell that learner "Google: Not
 * Linked" seconds after they used Google. This is the missing half: which
 * social provider the Dynamic session was verified with, and the address of
 * the embedded wallet it created.
 */
export interface DynamicSessionInfo {
  /** Address of the session's embedded Solana wallet, or null without one. */
  solanaAddress: string | null;
  hasGoogle: boolean;
  hasGithub: boolean;
}

/**
 * Reads the Dynamic session and reports it upward. Renders nothing.
 *
 * A separate component for the same reason `DynamicGoogleSignIn` is one: the
 * Dynamic hooks throw `MissingProviderError` outside a `DynamicProvider`, and
 * hooks cannot be conditional, so the `isDynamicEnabled()` gate has to be a
 * component boundary — the parent mounts this only when the feature is on,
 * and the settings page cannot crash when it's off.
 *
 * Provider detection reads `verifiedCredentials` off `useUser()`'s `SdkUser`
 * (`oauthProvider` is set on oauth-format credentials); the wallet address
 * comes from `useGetWalletAccounts()` filtered to the Solana chain. Both hooks
 * re-render on session changes, which matters here because the Dynamic client
 * initialises after first paint.
 */
export function DynamicSessionProbe({
  onSession,
}: {
  onSession: (info: DynamicSessionInfo) => void;
}) {
  const { data: dynamicUser } = useUser();
  const { data: walletAccounts } = useGetWalletAccounts();

  const solanaAddress =
    walletAccounts?.find((account) => account.chain === "SOL")?.address ?? null;
  // `oauthProvider` is a string enum (ProviderEnum) from a transitive package
  // this app doesn't depend on — compare through String() instead of importing
  // the enum across the pnpm boundary.
  const providers = new Set(
    (dynamicUser?.verifiedCredentials ?? [])
      .map((credential) => credential.oauthProvider)
      .filter((provider): provider is NonNullable<typeof provider> =>
        Boolean(provider)
      )
      .map((provider) => String(provider))
  );
  const hasGoogle = providers.has("google");
  const hasGithub = providers.has("github");

  useEffect(() => {
    onSession({ solanaAddress, hasGoogle, hasGithub });
  }, [onSession, solanaAddress, hasGoogle, hasGithub]);

  return null;
}
