"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { onEvent } from "@dynamic-labs-sdk/client";
import { getCore } from "@dynamic-labs-sdk/client/core";
import { useAuth } from "@/lib/auth/auth-provider";
import { getDynamicClient } from "@/lib/dynamic/client";
import { getDynamicSolanaAccount } from "@/lib/dynamic/solana";
import type { SolanaWalletAccount } from "@/lib/dynamic/solana";

/**
 * Is the learner's embedded wallet usable right now, and if not, why?
 *
 * One hook so enrol, unenrol, and anything added later branch on the same four
 * states instead of each re-deriving them from a nullable account.
 *
 * ## Why this does not use the SDK's React hooks
 *
 * `useInitStatus` / `useUser` / `useSessionExpiresAt` / `useOnEvent` would be
 * the obvious build — but every one of them throws `MissingProviderError`
 * outside a `DynamicProvider`, and `DynamicWalletProvider` renders bare
 * children when `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is unset. Hooks cannot be
 * conditional, so an SDK hook here would crash the course page and the
 * dashboard on every unconfigured build — the one thing `lib/dynamic/config.ts`
 * promises can never happen. The codebase already meets this constraint with an
 * imperative read (`DynamicSocialSignIn` uses `getCore` for the same reason);
 * this subscribes to that same core state through `useSyncExternalStore`, which
 * is reactive, provider-free and SSR-safe.
 *
 * ## Why the snapshot is a string
 *
 * `useSyncExternalStore` compares snapshots by identity and the core state
 * object is replaced on every write, so returning the state itself would
 * re-render on unrelated churn (project settings, the nonce pool). A short
 * derived key changes only when something this hook reads could have changed.
 */
export type DynamicSessionStatus = "valid" | "expired" | "loading" | "none";

export interface DynamicSessionState {
  status: DynamicSessionStatus;
  /** The signer — non-null exactly when `status === "valid"`. */
  account: SolanaWalletAccount | null;
}

/** Logout reasons that mean "the session died", not "the learner left". */
const EXPIRY_LOGOUT_REASONS = new Set([
  "token-expired",
  "session-refresh-unauthorized",
  "user-refresh-failed",
]);

function subscribe(onStoreChange: () => void): () => void {
  const client = getDynamicClient();
  if (!client) return () => {};
  try {
    return getCore(client).state.subscribe(onStoreChange);
  } catch {
    return () => {};
  }
}

function snapshot(): string {
  const client = getDynamicClient();
  if (!client) return "off";
  try {
    return [
      client.initStatus,
      client.user?.id ?? "",
      client.sessionExpiresAt?.getTime() ?? "",
    ].join("|");
  } catch {
    return "off";
  }
}

/** SSR renders as "not ready yet", which is what `loading` already means. */
function serverSnapshot(): string {
  return "ssr";
}

export function useDynamicSessionState(): DynamicSessionState {
  const { profile } = useAuth();
  const walletKind = profile?.wallet_kind ?? null;

  // The value is not used directly: it is the change signal that makes the
  // imperative read below re-run.
  useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  // A logout the SDK raised for us — the in-session half of the failure. It
  // fires when the expiry timer trips or a refresh comes back unauthorised,
  // and it is the only signal a learner with no recorded `wallet_kind` gets,
  // because a reload past expiry emits nothing at all.
  const [sawExpiryLogout, setSawExpiryLogout] = useState(false);
  useEffect(() => {
    const client = getDynamicClient();
    if (!client) return;
    try {
      return onEvent(
        {
          event: "logout",
          listener: (metadata) => {
            if (metadata && EXPIRY_LOGOUT_REASONS.has(metadata.reason)) {
              setSawExpiryLogout(true);
            }
          },
        },
        client
      );
    } catch {
      return;
    }
  }, []);

  const state = getDynamicSolanaAccount(walletKind);

  // A live account means the learner is back in; the sticky flag has to stop
  // describing them. Cleared in an effect, never during render.
  useEffect(() => {
    if (state.kind === "account") setSawExpiryLogout(false);
  }, [state.kind]);

  switch (state.kind) {
    case "account":
      return { status: "valid", account: state.account };
    case "loading":
      return { status: "loading", account: null };
    case "expired":
      return { status: "expired", account: null };
    case "none":
      return {
        status: sawExpiryLogout ? "expired" : "none",
        account: null,
      };
  }
}
