"use client";

import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  startDynamicSocialSignIn,
  type DynamicSocialProvider,
} from "@/lib/dynamic/social";
import { trackEvent } from "@/lib/analytics";
import { GoogleLogo } from "@/components/icons/google-logo";

/**
 * A social sign-in button routed through Dynamic instead of Supabase OAuth.
 *
 * Same account either way — `/api/auth/dynamic` matches on the
 * provider-verified email — but this path also leaves the learner with an
 * embedded Solana wallet, which the Supabase OAuth path does not.
 *
 * The click ends in a full-page navigation to the provider, so nothing after
 * `signInWithSocialRedirect` runs in this component. The return leg is handled
 * by `DynamicAuthHandler`; there is no popup variant on web (see
 * `lib/dynamic/social.ts`).
 *
 * The redirect itself lives in `lib/dynamic/social.ts` so the expired-session
 * prompt can start the same flow. It reads the Dynamic session imperatively
 * (the SDK's own `getCore` escape hatch) rather than through `useUser`,
 * because since #1097 this renders in the lazily-loaded modal body OUTSIDE any
 * `DynamicProvider` — every `@dynamic-labs-sdk/react-hooks` hook throws
 * `MissingProviderError` there. One component serves every provider — adding a
 * third is a PROVIDERS entry, not a copy-paste.
 */
interface ProviderConfig {
  Icon: ComponentType<{ className?: string }>;
  /** auth.* key for the button label. */
  labelKey: string;
  /** auth.* key for the redirect-failure message (rendered by the parent). */
  errorKey: string;
}

const PROVIDERS: Record<DynamicSocialProvider, ProviderConfig> = {
  google: {
    Icon: GoogleLogo,
    labelKey: "signInWithGoogle",
    errorKey: "googleSignInFailed",
  },
  github: {
    Icon: ({ className }) => <GithubLogo className={className} weight="fill" />,
    labelKey: "signInWithGitHub",
    errorKey: "githubSignInFailed",
  },
};

export function DynamicSocialSignIn({
  provider,
  disabled,
  onError,
}: {
  provider: DynamicSocialProvider;
  disabled: boolean;
  /**
   * Error channel (#1077): the parent renders the failure message where every
   * other sign-in error already renders (the modal-level `role="alert"`), so
   * Dynamic and Supabase-fallback errors share one placement and size.
   * Called with `null` when a new attempt starts.
   */
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("auth");
  const [starting, setStarting] = useState(false);
  const { Icon, labelKey, errorKey } = PROVIDERS[provider];

  const handleClick = async () => {
    setStarting(true);
    onError(null);
    trackEvent("auth_method_selected", { method: `dynamic_${provider}` });
    try {
      // Shared with the expired-session prompt (`lib/dynamic/social.ts`),
      // which needs the identical flow. The stale-session clear and the
      // return-URL handling live there.
      await startDynamicSocialSignIn(provider);
    } catch (err) {
      console.error(`[DynamicSocialSignIn:${provider}] redirect failed:`, err);
      onError(t(errorKey));
      setStarting(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-12 w-full gap-3 text-sm font-medium"
      disabled={disabled || starting}
      onClick={handleClick}
    >
      {starting ? (
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {starting ? t("connecting") : t(labelKey)}
    </Button>
  );
}
