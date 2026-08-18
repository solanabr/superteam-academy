"use client";

import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { logout, signInWithSocialRedirect } from "@dynamic-labs-sdk/client";
import { useUser } from "@dynamic-labs-sdk/react-hooks";
import { GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { trackEvent } from "@/lib/analytics";

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
 * Split out because `useUser` throws `MissingProviderError` outside a
 * `DynamicProvider`, and hooks cannot be conditional, so the feature gate has
 * to be a component boundary. One component serves every provider — adding a
 * third is a PROVIDERS entry, not a copy-paste.
 */
type DynamicSocialProvider = "google" | "github";

interface ProviderConfig {
  Icon: ComponentType<{ className?: string }>;
  /** auth.* key for the button label. */
  labelKey: string;
  /** auth.* key for the inline redirect-failure message. */
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
}: {
  provider: DynamicSocialProvider;
  disabled: boolean;
}) {
  const t = useTranslations("auth");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: dynamicUser } = useUser();
  const { Icon, labelKey, errorKey } = PROVIDERS[provider];

  const handleClick = async () => {
    setStarting(true);
    setError(null);
    trackEvent("auth_method_selected", { method: `dynamic_${provider}` });
    try {
      // Same stale-session hazard the email form guards against, with a
      // different symptom: `processSocialCallback` branches on `client.user`
      // and calls `oauthVerify` (LINK this account to the existing Dynamic
      // user) instead of `oauthSignIn` when one is present. This button is
      // strictly sign-in, so a session that predates it is cleared.
      if (dynamicUser) await logout();
      await signInWithSocialRedirect({
        provider,
        // Back to the page they left. The SDK strips its own params off this
        // before storing it, and re-adds them on the way back.
        redirectUrl: window.location.href,
      });
    } catch (err) {
      console.error(`[DynamicSocialSignIn:${provider}] redirect failed:`, err);
      setError(t(errorKey));
      setStarting(false);
    }
  };

  return (
    <div className="space-y-1.5">
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
      {error && (
        <p className="text-center text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
