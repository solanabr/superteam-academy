"use client";

import { useTranslations } from "next-intl";
import { GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { createClient } from "@/lib/supabase/client";
import { buildOAuthRedirect } from "@/lib/auth/oauth-redirect";
import { trackEvent } from "@/lib/analytics";
import type {
  AuthLoadingMethod,
  SocialProvider,
} from "@/components/auth/auth-modal-types";

interface ProviderConfig {
  Icon: React.ComponentType<{ className?: string }>;
  /** auth.* key for the button label. */
  labelKey: string;
  /** auth.* key for the failure message (rendered by the parent). */
  errorKey: string;
}

const PROVIDERS: Record<SocialProvider, ProviderConfig> = {
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

/**
 * Plain `supabase.auth.signInWithOAuth` sign-in — the Google/GitHub path that
 * runs when Dynamic is unconfigured, and the kill switch that restores the
 * pre-Dynamic buttons untouched.
 *
 * Deliberately its own module, statically importable from anywhere: this is
 * the ONE way in that needs neither wallet-adapter nor the Dynamic SDK, so it
 * must not sit behind the lazy chunk that carries them. `auth-modal.tsx`
 * renders it directly when that chunk fails to load, which is what keeps
 * Google and GitHub reachable on a blocked CDN or a stale deploy (#1109
 * review). Imports nothing heavier than the Supabase browser client, which
 * the header already carries.
 */
export function OAuthFallbackButton({
  provider,
  loading,
  setLoading,
  setErrorMessage,
}: {
  provider: SocialProvider;
  loading: AuthLoadingMethod;
  setLoading: (v: AuthLoadingMethod) => void;
  setErrorMessage: (v: string | null) => void;
}) {
  const t = useTranslations("auth");
  const { Icon, labelKey, errorKey } = PROVIDERS[provider];

  const handleClick = async () => {
    setLoading(provider);
    setErrorMessage(null);
    trackEvent("auth_method_selected", { method: provider });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // Return the learner to the page they signed in from (#619 review):
          // the OAuth callback otherwise always lands on /dashboard, stranding
          // someone mid-lesson — and, post-LX-A4, away from the replay that
          // finishes their banked work. The path-shape guard lives in
          // buildOAuthRedirect (unit-tested); the callback re-sanitizes
          // server-side too.
          redirectTo: buildOAuthRedirect(
            window.location.origin,
            window.location.pathname
          ),
        },
      });
      if (error) {
        console.error(`[AuthModal] ${provider} sign-in error:`, error.message);
        setErrorMessage(t(errorKey));
        setLoading(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t(errorKey);
      console.error(`[AuthModal] ${provider} sign-in error:`, message);
      setErrorMessage(t(errorKey));
      setLoading(null);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-12 w-full gap-3 text-sm font-medium"
      onClick={handleClick}
      disabled={loading !== null}
    >
      {loading === provider ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {loading === provider ? t("connecting") : t(labelKey)}
    </Button>
  );
}
