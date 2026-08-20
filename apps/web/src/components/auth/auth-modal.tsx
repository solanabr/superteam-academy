"use client";

import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
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
  getAmbientWallet,
  useAmbientStackCount,
  useAmbientWalletLive,
  useSiwsActive,
  useWalletReturnCaptureActive,
} from "@/lib/solana/ambient-wallet-store";
import { ChunkErrorBoundary } from "@/components/auth/chunk-error-boundary";
import { OAuthFallbackButton } from "@/components/auth/oauth-fallback-button";
import { useSocialReturnPending } from "@/hooks/use-social-return-pending";
import type { AuthLoadingMethod } from "@/components/auth/auth-modal-types";
import type { AuthModalBodyProps } from "@/components/auth/auth-modal-body";

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
  // Stable, so the effects and the lazy body that take it as a dependency
  // don't re-run on every parent render.
  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  const [loading, setLoading] = useState<AuthLoadingMethod>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Every close resets, whichever path closed us. `loading` lives here while
  // the body's `awaitingStack` is a ref inside the lazy chunk, so a body
  // remount mid-load would otherwise orphan a truthy `loading` forever — and
  // `onOpenChange` below refuses to close while it is truthy (#1126).
  useEffect(() => {
    if (open) return;
    setLoading(null);
    setErrorMessage(null);
  }, [open]);

  // The SIWS overlay has taken the screen (#1109 follow-up): since #1097 the
  // dialog is what mounts the wallet stack, and `autoConnect` can reconnect a
  // remembered wallet and fire SIWS while the dialog is still open. Radix
  // marks the body `pointer-events: none` for a modal dialog, and the overlay
  // portals into that body — leaving its Retry and Dismiss buttons visible
  // but unclickable over a dialog the scrim covers. Close, exactly as the
  // manual wallet path does before handing off to the wallet-select modal.
  const siwsActive = useSiwsActive();
  useEffect(() => {
    if (siwsActive && open) setOpen(false);
  }, [siwsActive, open, setOpen]);

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
  //
  // Nothing in the dialog WAITS on that stack any more — the body renders as
  // soon as its own chunk lands, and the Solana button alone tracks the
  // registration (#1109 review). Keeping the two downloads gated on each
  // other also made them serial.
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
  //
  // TIMING (review): the disarm effect runs in the same React commit that
  // renders the new route's layout, so the two WalletProviders overlap for at
  // most a single frame — while autoConnect's connect() is an async
  // round-trip into the wallet extension that has not resolved yet, and
  // WalletAuthHandler only fires SIWS on `connected` flipping true. A
  // double-SIWS would need the overlap to outlive that round-trip; one frame
  // cannot. This effect must NOT be merged into the same commit as the route
  // swap by moving it into render — keep it an effect.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    if (!openRef.current) setScopedMounted(false);
  }, [pathname]);

  // …and while OPEN: navigation with the dialog up (or any second stack
  // registering) shows as a registration count of 2 — this stack's own
  // registration plus the newcomer's. Dropping ours converges back to one;
  // the body keeps working against the newcomer via the store (review NEW-2).
  const stackCount = useAmbientStackCount();
  useEffect(() => {
    if (scopedMounted && stackCount >= 2) setScopedMounted(false);
  }, [scopedMounted, stackCount]);

  // Chunk-load failure handling (review F3): a lazy is recreated per attempt
  // because a rejected React.lazy caches its rejection.
  //
  // The two chunks fail separately and cost different things (#1109 review):
  // a dead STACK chunk only takes the wallet button with it, while a dead
  // BODY chunk takes the whole button set — and Google/GitHub need neither,
  // so they are re-rendered here from the static fallback module rather than
  // left behind a "Try again". Separate attempt counters keep one retry from
  // remounting the other half, which would drop the body's in-flight state.
  const [stackFailed, setStackFailed] = useState(false);
  const [bodyFailed, setBodyFailed] = useState(false);
  const [stackAttempt, setStackAttempt] = useState(0);
  const [bodyAttempt, setBodyAttempt] = useState(0);
  const retryWalletStack = () => {
    setStackFailed(false);
    setStackAttempt((a) => a + 1);
  };
  const retryBody = () => {
    setBodyFailed(false);
    setBodyAttempt((a) => a + 1);
    // Or a retry that lands would show the previous failure under a fresh
    // button set.
    setErrorMessage(null);
  };
  const LazyBody = useMemo(() => {
    void bodyAttempt; // cache-buster: a new attempt makes a fresh lazy
    return lazy(
      () => import("@/components/auth/auth-modal-body")
    ) as ComponentType<AuthModalBodyProps>;
  }, [bodyAttempt]);
  const LazyStack = useMemo(() => {
    void stackAttempt;
    return lazy(() => import("@/components/auth/scoped-auth-providers"));
  }, [stackAttempt]);

  // The wallet handoff — brief loading state, close, then open the
  // wallet-select modal of whichever stack is live. It lives here rather than
  // in the body because closing the dialog UNMOUNTS the body: timers started
  // there would be cleared exactly when the picker is due to open. AuthModal
  // survives the close (it renders in the Header), and clears them if IT
  // unmounts — the case that would otherwise pop the wallet picker open
  // unbidden on whatever route the learner moved to.
  const handoffTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = handoffTimers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const startWalletHandoff = useCallback(() => {
    const at = (fn: () => void, ms: number) => {
      handoffTimers.current.push(setTimeout(fn, ms));
    };
    at(() => {
      // Read the store BEFORE closing: a stack that unregistered during the
      // wait has no modal to hand off to, and closing first would leave the
      // learner on the page with the spinner gone and no error anywhere.
      if (!getAmbientWallet()) {
        setLoading(null);
        setErrorMessage(t("authFailed"));
        return;
      }
      setOpen(false);
      setLoading(null);
      at(() => {
        const live = getAmbientWallet();
        if (live) {
          live.openWalletModal();
          return;
        }
        // Vanished inside the close window — re-open with the failure rather
        // than leave the click unanswered.
        setOpen(true);
        setErrorMessage(t("authFailed"));
      }, 200);
    }, 400);
  }, [setOpen, t]);

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
          key={`stack-${stackAttempt}`}
          onError={() => setStackFailed(true)}
        >
          <Suspense fallback={null}>
            <LazyStack />
          </Suspense>
        </ChunkErrorBoundary>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          // The close reset lives in the `open` effect above, so it covers
          // every path in (Later, the wallet handoff, a controlled parent).
          if (!loading) setOpen(v);
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
          {bodyFailed ? (
            // The button set is gone with its chunk, but two of the three ways
            // in never needed it: render them from the static module so a
            // blocked CDN or a stale deploy costs the wallet path only.
            <div className="mt-6 space-y-3">
              {/* One error placement (#1077): a later OAuth failure replaces
                  the chunk message rather than stacking a second alert.
                  Not `authFailed` — no wallet was involved and nothing was
                  attempted, and this is what a screen reader announces the
                  moment the modal opens. */}
              <p
                className="mx-auto max-w-xs text-center text-sm font-medium text-danger"
                role="alert"
              >
                {errorMessage ?? t("optionsLoadFailed")}
              </p>
              <OAuthFallbackButton
                provider="google"
                loading={loading}
                setLoading={setLoading}
                setErrorMessage={setErrorMessage}
              />
              <OAuthFallbackButton
                provider="github"
                loading={loading}
                setLoading={setLoading}
                setErrorMessage={setErrorMessage}
              />
              <div className="flex justify-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryBody}
                  disabled={loading !== null}
                >
                  {t("retry")}
                </Button>
              </div>
            </div>
          ) : (
            <ChunkErrorBoundary
              key={`body-${bodyAttempt}`}
              onError={() => setBodyFailed(true)}
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
                  walletStackFailed={stackFailed}
                  retryWalletStack={retryWalletStack}
                  startWalletHandoff={startWalletHandoff}
                />
              </Suspense>
            </ChunkErrorBoundary>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
