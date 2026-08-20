"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useHasAmbientWallet } from "@/lib/solana/optional-wallet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSocialReturnPending } from "@/hooks/use-social-return-pending";
import type {
  AuthLoadingMethod,
  AuthModalBodyProps,
} from "@/components/auth/auth-modal-body";

// Both lazy (#1097): this shell renders in the global Header on every route,
// so the dialog innards (wallet-adapter-react-ui + the Dynamic SDK via
// DynamicSocialSignIn) and the wallet/Dynamic provider stack load on the
// sign-in click, never with a marketing first load.
const AuthModalBody = lazy(() => import("@/components/auth/auth-modal-body"));
const ScopedAuthProviders = lazy(
  () => import("@/components/auth/scoped-auth-providers")
);

interface AuthModalProps {
  trigger?: React.ReactNode;
  /**
   * Controlled open state. Pass together with `onOpenChange` to drive the
   * modal programmatically (e.g. an anonymous Enroll click, #556). When
   * controlled and no `trigger` is given, no trigger button is rendered.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Claim-moment mode (LX-A4b): the learner just did the work and is being asked
   * to sign in to keep it. Shows the "keep your progress" framing plus a "Later"
   * escape that dismisses without ever implying the work is lost — it stays
   * banked locally (F4: never "discard progress").
   */
  showLater?: boolean;
  onLater?: () => void;
}

export function AuthModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
  showLater = false,
  onLater,
}: AuthModalProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [loading, setLoading] = useState<AuthLoadingMethod>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // While the Google-return handshake runs, the trigger button carries the
  // loading state — the alternative was a full-screen overlay, and the owner
  // preferred the button.
  const socialReturnPending = useSocialReturnPending();

  // On (platform) routes the wallet/Dynamic providers are ambient in the
  // layout; on marketing/admin routes they are not (#1097), and the first
  // open lazily mounts ScopedAuthProviders around the whole Dialog instead.
  // Around the DIALOG, not just its content, and sticky once mounted: the
  // Solana path closes this modal and hands off to the wallet-select modal,
  // whose provider (and the SIWS auth handler) must survive that close.
  // Never both: the ambient check is the double-mount guard — nesting a
  // second WalletProvider would duplicate autoConnect and wallet listeners.
  const hasAmbientWallet = useHasAmbientWallet();
  const [scopedMounted, setScopedMounted] = useState(false);
  useEffect(() => {
    // An effect rather than a setOpen side effect so controlled openers
    // (open prop flipped by a parent) take the scoped path too.
    if (open && !hasAmbientWallet) setScopedMounted(true);
  }, [open, hasAmbientWallet]);

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          setOpen(v);
          if (!v) setErrorMessage(null);
        }
      }}
    >
      {(trigger !== undefined || !isControlled) && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="push" disabled={socialReturnPending}>
              {socialReturnPending ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  {t("signingIn")}
                </span>
              ) : (
                tCommon("signIn")
              )}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <AuthModalBodyGate
          loading={loading}
          setLoading={setLoading}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          setOpen={setOpen}
          showLater={showLater}
          onLater={onLater}
        />
      </DialogContent>
    </Dialog>
  );

  if (hasAmbientWallet || !scopedMounted) return dialog;
  // The fallback renders the SAME dialog while the provider chunk loads, so
  // the trigger never flickers out; the swap remounts the Dialog subtree with
  // `open` preserved in this component's state.
  return (
    <Suspense fallback={dialog}>
      <ScopedAuthProviders>{dialog}</ScopedAuthProviders>
    </Suspense>
  );
}

/**
 * Renders the dialog body only once wallet providers resolve above it.
 * On (platform) routes that is immediate; on the scoped path it holds a
 * spinner for the moment the Dialog still renders as the Suspense fallback
 * OUTSIDE ScopedAuthProviders — mounting the body there would call Dynamic
 * hooks without a provider, which throw.
 */
function AuthModalBodyGate(props: AuthModalBodyProps) {
  const t = useTranslations("auth");
  const providersReady = useHasAmbientWallet();
  const spinner = (
    <div
      className="flex h-40 items-center justify-center"
      role="status"
      aria-label={t("signingIn")}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
  if (!providersReady) return spinner;
  return (
    <Suspense fallback={spinner}>
      <AuthModalBody {...props} />
    </Suspense>
  );
}
