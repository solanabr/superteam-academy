"use client";

import { useState } from "react";
import { Envelope } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { isDeviceRegistrationRequired } from "@dynamic-labs-sdk/client";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const INPUT_CLASS =
  "h-12 w-full rounded-md border border-border bg-subtle px-3 text-sm text-text placeholder:text-text-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";

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
          } catch {
            setError(t("otpInvalid"));
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
        setError(null);
        try {
          await sendEmailOTP({ email });
        } catch {
          setError(t("emailSignInFailed"));
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
