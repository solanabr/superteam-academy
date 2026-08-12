"use client";

import { Envelope } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

/**
 * The email/social sign-in button, split out of `AuthModal` for one reason:
 * `useDynamicContext()` THROWS on the client when no `DynamicContextProvider`
 * is mounted.
 *
 *   const DynamicContext = createContext(undefined);
 *   if (context === undefined) {
 *     if (isSSR()) return SSR_SAFE_DYNAMIC_CONTEXT;
 *     throw new Error('Hook must be used within <DynamicContextProvider>.');
 *   }
 *
 * The SSR branch makes this especially nasty: with the environment id unset the
 * page server-renders fine and then throws on hydration, so it would look
 * healthy in a build log and break sign-in for every learner. An earlier
 * revision called the hook unconditionally in `AuthModal` on the assumption
 * that it degraded to a default context — it does not.
 *
 * Hooks cannot be called conditionally, so the gate has to be a component
 * boundary: `AuthModal` renders this only when Dynamic is enabled, which is
 * exactly when the provider is mounted, so the hook is always inside one.
 */
export function DynamicSignInButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("auth");
  const { setShowAuthFlow } = useDynamicContext();

  return (
    <div className="space-y-1.5">
      <Button
        variant="push"
        className="h-12 w-full gap-3 text-sm font-medium"
        disabled={disabled}
        onClick={() => {
          trackEvent("auth_method_selected", { method: "dynamic" });
          // Only OPENS Dynamic's flow. The wallet appearing, the SIWS
          // signature and the Supabase session are all handled by
          // DynamicAuthHandler, because the wallet can also arrive from a
          // restored session with no modal involved.
          setShowAuthFlow(true);
        }}
      >
        <Envelope size={20} weight="fill" aria-hidden="true" />
        {t("continueWithEmail")}
      </Button>
      <p className="text-center text-xs text-text-3">
        {t("emailWalletSubtitle")}
      </p>
    </div>
  );
}
