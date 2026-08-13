"use client";

import { useState } from "react";
import { Envelope } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import {
  BaseError,
  isDeviceRegistrationRequired,
} from "@dynamic-labs-sdk/client";
import { APIError } from "@dynamic-labs-sdk/client/core";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const INPUT_CLASS =
  "h-12 w-full rounded-md border border-border bg-subtle px-3 text-sm text-text placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";

/**
 * The server codes that genuinely mean "the six digits were wrong (or stale)".
 * Verified against the live API: a wrong code returns HTTP 422
 * `wrong_email_verification_token`.
 *
 * Everything else must NOT be collapsed into "code isn't right" — that
 * mislabel sent a real failure on a correct code round in circles, because the
 * true error (whatever the server said) was invisible to both the learner and
 * anyone debugging it.
 */
const WRONG_CODE_ERRORS = new Set([
  "wrong_email_verification_token",
  "email_verification_expired",
]);

/**
 * Whether a failure is the send/verify rate limit rather than a real error.
 *
 * Verified against the live API: the 4th send for one address inside 10
 * minutes comes back HTTP 429 — and that response's body carries no `code`
 * field, so the SDK labels it `unknown_error`. Matching on the STATUS is
 * therefore the reliable signal; the code alone would misfile it under
 * "something broke, try again", which is the exact opposite of the truth —
 * trying again is the one thing that keeps the limit burning.
 *
 * `too_many_email_verification_attempts` is the verify-side sibling: three
 * wrong codes burn the verification itself.
 */
function isRateLimited(err: unknown): boolean {
  if (!(err instanceof APIError)) return false;
  return (
    err.status === 429 || err.code === "too_many_email_verification_attempts"
  );
}

/**
 * Email sign-in, rendered by this app rather than by Dynamic.
 *
 * This is the whole point of the headless SDK. The legacy SDK's
 * `setShowAuthFlow(true)` opened Dynamic's own modal, and that modal is a
 * WALLET PICKER — a learner with no wallet was shown 159 wallets to install,
 * MetaMask included, which is the exact problem embedded wallets exist to
 * solve. No dashboard setting removes it. Here the only thing on screen is an
 * email field, and the wallet is created for the learner afterwards by
 * `DynamicAuthHandler`.
 *
 * Split into its own component for a second reason that outlived the first:
 * these hooks throw `MissingProviderError` outside a `DynamicProvider`, and
 * hooks cannot be called conditionally. `AuthModal` renders this only when
 * Dynamic is enabled — which is exactly when the provider is mounted — so the
 * gate is a component boundary rather than an `if` around a hook.
 */
export function DynamicEmailSignIn({ disabled }: { disabled: boolean }) {
  const t = useTranslations("auth");
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [awaitingDevice, setAwaitingDevice] = useState(false);

  const {
    mutateAsync: sendEmailOTP,
    data: otpVerification,
    isPending: sending,
    reset: resetSend,
  } = useSendEmailOTP();
  const { mutateAsync: verifyOTP, isPending: verifying } = useVerifyOTP();

  const busy = disabled || sending || verifying;

  // Dynamic mailed a "verify this device" link. Nothing more can happen in this
  // tab until the learner opens it; `DynamicAuthHandler` consumes the redirect.
  if (awaitingDevice) {
    return (
      <div className="rounded-lg border border-border bg-subtle p-4 text-center">
        <p className="text-sm font-medium">{t("deviceCheckTitle")}</p>
        <p className="mt-1 text-xs text-text-3">
          {t("deviceCheckSubtitle", { email })}
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="space-y-1.5">
        <Button
          variant="push"
          className="h-12 w-full gap-3 text-sm font-medium"
          disabled={disabled}
          onClick={() => {
            trackEvent("auth_method_selected", { method: "dynamic" });
            setExpanded(true);
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

  // Second step: the code. `otpVerification` is what `sendEmailOTP` resolved
  // to, and `verifyOTP` needs that exact object back — it carries the
  // verification UUID that ties the code to this attempt.
  if (otpVerification) {
    return (
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          // `isPending` flips only on the next render, so a double-click can
          // fire twice within one tick. Three wrong attempts BURN the
          // verification server-side (`too_many_email_verification_attempts`),
          // so accidental duplicates are not merely wasteful here.
          if (busy) return;
          setError(null);
          try {
            const response = await verifyOTP({
              otpVerification,
              verificationToken: code,
            });
            // A learner who still has to register this device is authenticated
            // but blocked from everything that matters, so say so rather than
            // showing a signed-in state that cannot do anything.
            if (response.user && isDeviceRegistrationRequired(response.user)) {
              setAwaitingDevice(true);
            }
          } catch (err) {
            // Only the codes that actually mean "wrong digits" get the
            // wrong-digits message. Everything else — a captcha demand, an
            // MFA requirement, a network failure, a bug in the post-verify
            // handling — surfaces as itself, because relabelling those as a
            // typo sends a learner with a CORRECT code in circles.
            console.error("[dynamic] verifyOTP failed", err);
            if (isRateLimited(err)) {
              setError(t("tooManyAttempts"));
            } else if (
              err instanceof BaseError &&
              WRONG_CODE_ERRORS.has(err.code)
            ) {
              setError(t("otpInvalid"));
            } else {
              const detail =
                err instanceof BaseError
                  ? err.code
                  : err instanceof Error
                    ? err.message
                    : String(err);
              setError(`${t("emailSignInFailed")} (${detail})`);
            }
          }
        }}
      >
        <input
          className={INPUT_CLASS}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("otpPlaceholder")}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t("otpPlaceholder")}
          disabled={busy}
        />
        <Button
          type="submit"
          variant="push"
          className="h-12 w-full text-sm font-medium"
          disabled={busy || code.length === 0}
        >
          {verifying ? t("signingIn") : t("verifyCode")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-text-3 underline-offset-2 hover:underline"
          disabled={busy}
          onClick={() => {
            setCode("");
            setError(null);
            resetSend();
          }}
        >
          {t("useDifferentEmail")}
        </button>
        {error && (
          <p className="text-center text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </form>
    );
  }

  // First step: the address.
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        // Sends are rate-limited to 3 per 10 minutes per address, so a
        // double-fired send costs a third of the budget. Same guard as the
        // verify form.
        if (busy) return;
        setError(null);
        try {
          await sendEmailOTP({ email });
        } catch (err) {
          console.error("[dynamic] sendEmailOTP failed", err);
          if (isRateLimited(err)) {
            setError(t("tooManyAttempts"));
          } else {
            const detail =
              err instanceof BaseError
                ? err.code
                : err instanceof Error
                  ? err.message
                  : String(err);
            setError(`${t("emailSignInFailed")} (${detail})`);
          }
        }
      }}
    >
      <input
        className={INPUT_CLASS}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        autoComplete="email"
        aria-label={t("emailPlaceholder")}
        disabled={busy}
      />
      <Button
        type="submit"
        variant="push"
        className="h-12 w-full text-sm font-medium"
        disabled={busy || email.length === 0}
      >
        {sending ? t("connecting") : t("sendCode")}
      </Button>
      {error && (
        <p className="text-center text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
