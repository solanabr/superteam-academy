"use client";

import {
  Component,
  forwardRef,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useAmbientWalletLive,
  useWalletReturnCaptureActive,
} from "@/lib/solana/ambient-wallet-store";
import { useSocialReturnPending } from "@/hooks/use-social-return-pending";
import type {
  AuthLoadingMethod,
  AuthModalBodyProps,
} from "@/components/auth/auth-modal-body";

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

/**
 * The button that opens the auth modal, with the social-return spinner built
 * in: while the Google/GitHub return handshake runs — or while the catcher is
 * standing up the provider stack for a redirect return (#1097) — the button
 * shows "Signing in…" and disables itself. AuthModal's default trigger; also
 * for custom triggers (the landing hero) that hand-copied this markup before
 * #1077. Forwards ref and props so it works under `DialogTrigger asChild`.
 */
export const AuthTriggerButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button> & { label: string }
>(function AuthTriggerButton({ label, disabled, ...props }, ref) {
  const t = useTranslations("auth");
  const socialReturnPending = useSocialReturnPending();
  const captureActive = useWalletReturnCaptureActive();
  const returning = socialReturnPending || captureActive;

  return (
    <Button ref={ref} disabled={disabled || returning} {...props}>
      {returning ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {t("signingIn")}
        </span>
      ) : (
        label
      )}
    </Button>
  );
});

/**
 * Catches a failed lazy chunk load (e.g. a stale chunk 404 right after a
 * deploy) so it surfaces as an in-modal retry instead of the root error page
 * (#1097 review F3). Remounted via `key` on retry, because a rejected
 * `React.lazy` stays rejected — the parent recreates the lazy components too.
 */
class ChunkErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
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
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [loading, setLoading] = useState<AuthLoadingMethod>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Where the wallet/Dynamic providers come from (#1097): on (platform)
  // routes the layout's stack is registered in the ambient store; elsewhere
  // the first open arms a lazily-loaded scoped stack, mounted as a SIBLING of
  // the Dialog (never around it — the Dialog's tree position stays stable)
  // and sticky after close, because the Solana path closes this modal and
  // hands off to the wallet-select modal, which lives in that stack.
  //
  // The two live-stack guards:
  //  - ambientLive: never arm while any stack is registered — nesting or
  //    duplicating WalletProvider doubles autoConnect, listeners, and SIWS.
  //  - captureActive: DynamicReturnCatcher has decided to mount its own stack
  //    for a redirect return but its chunk has not registered yet; arming in
  //    that window would race it (review F4).
  const ambientLive = useAmbientWalletLive();
  const captureActive = useWalletReturnCaptureActive();
  const [scopedMounted, setScopedMounted] = useState(false);
  useEffect(() => {
    // An effect rather than a setOpen side effect so controlled openers
    // (open prop flipped by a parent) take the scoped path too.
    if (open && !ambientLive && !captureActive) setScopedMounted(true);
  }, [open, ambientLive, captureActive]);

  // Disarm on client-side navigation while closed: without this, a scoped
  // stack armed on a marketing page would keep living beside the (platform)
  // stack after the learner navigates there.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    if (!openRef.current) setScopedMounted(false);
  }, [pathname]);

  // Chunk-load failure handling (review F3): both lazies are recreated per
  // attempt because a rejected React.lazy caches its rejection.
  const [chunkFailed, setChunkFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { LazyBody, LazyStack } = useMemo(() => {
    void attempt; // cache-buster: a new attempt makes fresh lazy components
    return {
      LazyBody: lazy(
        () => import("@/components/auth/auth-modal-body")
      ) as ComponentType<AuthModalBodyProps>,
      LazyStack: lazy(() => import("@/components/auth/scoped-auth-providers")),
    };
  }, [attempt]);

  const spinner = (
    <div
      className="flex h-40 items-center justify-center"
      role="status"
      aria-label={t("signingIn")}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );

  return (
    <>
      {scopedMounted ? (
        <ChunkErrorBoundary
          key={`stack-${attempt}`}
          onError={() => setChunkFailed(true)}
        >
          <Suspense fallback={null}>
            <LazyStack />
          </Suspense>
        </ChunkErrorBoundary>
      ) : null}
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
            {/* While the Google-return handshake runs, the trigger button
                carries the loading state — the alternative was a full-screen
                overlay, and the owner preferred the button. */}
            {trigger ?? (
              <AuthTriggerButton variant="push" label={tCommon("signIn")} />
            )}
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t(showLater ? "keepProgressTitle" : "signInTitle")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t(showLater ? "keepProgressSubtitle" : "signInSubtitle")}
            </DialogDescription>
          </DialogHeader>
          {chunkFailed ? (
            <div className="mt-6 flex flex-col items-center gap-4">
              <p
                className="max-w-xs text-center text-sm font-medium text-danger"
                role="alert"
              >
                {t("authFailed")}
              </p>
              <Button
                variant="push"
                size="sm"
                onClick={() => {
                  setChunkFailed(false);
                  setAttempt((a) => a + 1);
                }}
              >
                {t("retry")}
              </Button>
            </div>
          ) : !ambientLive ? (
            // The provider stack is still standing up (scoped chunk loading,
            // or the catcher's) — the body needs it registered before the
            // wallet buttons can do anything.
            spinner
          ) : (
            <ChunkErrorBoundary
              key={`body-${attempt}`}
              onError={() => setChunkFailed(true)}
            >
              <Suspense fallback={spinner}>
                <LazyBody
                  loading={loading}
                  setLoading={setLoading}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                  setOpen={setOpen}
                  showLater={showLater}
                  onLater={onLater}
                />
              </Suspense>
            </ChunkErrorBoundary>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
