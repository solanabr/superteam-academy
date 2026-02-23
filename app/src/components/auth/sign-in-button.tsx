"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { LogOut, LogIn } from "lucide-react";
import { WalletMenu } from "./wallet-menu";

/** Unified auth button — opens Privy modal with wallet + Google + GitHub options */
export function AuthButton() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login } = useLogin();

  if (!ready) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />;
  }

  if (authenticated && user) {
    // Wallet auth → full dropdown menu
    if (user.wallet) {
      return <WalletMenu />;
    }

    // Social auth only (Google / GitHub) → simple display + sign-out
    const displayName = user.google?.name ?? "User";
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:block">
          {displayName}
        </span>
        <button
          onClick={logout}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      aria-label="Sign in"
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign In</span>
    </button>
  );
}

/** @deprecated Use AuthButton instead */
export const GoogleSignInButton = AuthButton;
