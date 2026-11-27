"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Ticket } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthModal, AuthTriggerButton } from "@/components/auth/auth-modal";
import { EventBadgeCard } from "@/components/events/event-badge-card";

interface RedeemedEvent {
  achievementId: string;
  name: string;
  description: string;
  imageUrl: string;
  startsAt: string;
  xpReward: number;
}

type RedeemState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; event: RedeemedEvent; walletLinked: boolean }
  | { status: "error"; key: string; date?: string };

const ERROR_KEYS: Record<string, string> = {
  invalidCode: "errorInvalidCode",
  notStarted: "errorNotStarted",
  ended: "errorEnded",
  notReady: "errorNotReady",
  alreadyRedeemed: "errorAlreadyRedeemed",
  rateLimited: "errorRateLimited",
};

export function RedeemEventForm({ initialCode }: { initialCode: string }) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user, isLoading } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [state, setState] = useState<RedeemState>({ status: "idle" });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || state.status === "submitting") return;
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/events/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await res.json()) as {
        error?: string;
        event?: RedeemedEvent;
        walletLinked?: boolean;
        startsAt?: string;
        endsAt?: string;
      };
      if (res.ok && body.event) {
        setState({
          status: "success",
          event: body.event,
          walletLinked: body.walletLinked ?? false,
        });
        return;
      }
      setState({
        status: "error",
        key: ERROR_KEYS[body.error ?? ""] ?? "errorGeneric",
        date: body.startsAt ?? body.endsAt,
      });
    } catch {
      setState({ status: "error", key: "errorGeneric" });
    }
  };

  if (state.status === "success") {
    return (
      <Card>
        <CardContent className="space-y-6 p-6 text-center">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-black tracking-[-0.5px]">
              {t("successTitle")}
            </h1>
            <p className="text-sm text-text-2">
              {t("successXp", { xp: state.event.xpReward })}
            </p>
          </div>
          <div className="mx-auto max-w-[240px]">
            <EventBadgeCard badge={state.event} showPending />
          </div>
          <p role="status" className="text-sm text-text-3">
            {state.walletLinked ? t("successMinting") : t("successNoWallet")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="push">
              <Link href={`/${locale}/profile`}>{t("viewProfile")}</Link>
            </Button>
            {!state.walletLinked && (
              <Button asChild variant="outline">
                <Link href={`/${locale}/settings?tab=account`}>
                  {t("linkWallet")}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start gap-3">
          <div className="set-row-icon shrink-0">
            <Ticket className="h-5 w-5" weight="bold" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-black tracking-[-0.5px]">
              {t("redeemTitle")}
            </h1>
            <p className="text-sm text-text-2">{t("redeemDescription")}</p>
          </div>
        </div>

        {!isLoading && !user ? (
          <div className="space-y-3">
            <p className="text-sm text-text-3">{t("signInToRedeem")}</p>
            <AuthModal
              trigger={
                <AuthTriggerButton
                  variant="push"
                  size="sm"
                  label={tCommon("signIn")}
                />
              }
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="set-label" htmlFor="event-code">
                {t("codeLabel")}
              </label>
              <input
                id="event-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (state.status === "error") setState({ status: "idle" });
                }}
                placeholder="ABCD-1234"
                maxLength={32}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="set-input font-mono uppercase tracking-[0.15em]"
                aria-describedby={
                  state.status === "error" ? "event-code-error" : undefined
                }
              />
            </div>
            {state.status === "error" && (
              <p
                id="event-code-error"
                role="alert"
                className="text-sm text-danger"
              >
                {t(state.key, {
                  date: state.date ? formatDate(state.date) : "",
                })}
              </p>
            )}
            <Button
              type="submit"
              variant="push"
              disabled={
                !code.trim() || state.status === "submitting" || isLoading
              }
            >
              {state.status === "submitting" && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {t("redeemButton")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
