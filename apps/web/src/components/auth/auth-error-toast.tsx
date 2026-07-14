"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { dispatchToast } from "@/components/ui/toast-container";

// Maps the `reason` query param that /api/auth/callback and middleware.ts
// attach to a refused-login redirect (`?error=auth&reason=<x>`) to a message
// key in the "auth" namespace. `account_deleted` is #461; the other three are
// pre-existing OAuth-callback failure reasons that had translated strings but
// no consumer — wiring them up here alongside #461 costs nothing extra and
// completes the pattern instead of leaving it half-built.
const REASON_MESSAGE_KEYS: Record<string, string> = {
  missing_code: "oauthMissingCode",
  exchange_failed: "oauthExchangeFailed",
  server_error: "oauthServerError",
  account_deleted: "accountDeleted",
};

/**
 * Surfaces a refused-login toast from the URL, then strips the params so a
 * refresh or back-navigation doesn't replay it. Renders nothing.
 */
export function AuthErrorToast() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") !== "auth") return;

    const reason = searchParams.get("reason") ?? "";
    const key = REASON_MESSAGE_KEYS[reason] ?? "oauthGenericError";
    dispatchToast(t(key), "error");

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("reason");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
