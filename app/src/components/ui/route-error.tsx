"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  icon?: LucideIcon;
  titleKey?: string;
  descriptionKey?: string;
  backHref?: string;
  backLabelKey?: string;
}

export function RouteError({
  error,
  reset,
  icon: Icon = AlertTriangle,
  titleKey = "global.title",
  descriptionKey = "global.description",
  backHref = "/",
  backLabelKey = "notFound.goHome",
}: RouteErrorProps) {
  const t = useTranslations("errors");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mt-6 text-3xl font-bold">{t(titleKey)}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {t(descriptionKey)}
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("global.tryAgain")}
        </button>
        <Link
          href={backHref}
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
        >
          {t(backLabelKey)}
        </Link>
      </div>
    </div>
  );
}
