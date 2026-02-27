"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useMemo } from "react";

// Inline translations — this error boundary is outside NextIntlClientProvider
// so useTranslations() is unavailable. We detect locale from the URL pathname.
const messages: Record<string, { title: string; description: string; tryAgain: string; goHome: string }> = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or return to the home page.",
    tryAgain: "Try again",
    goHome: "Go home",
  },
  es: {
    title: "Algo salio mal",
    description: "Ocurrio un error inesperado. Intenta de nuevo o vuelve a la pagina principal.",
    tryAgain: "Intentar de nuevo",
    goHome: "Ir al inicio",
  },
  "pt-br": {
    title: "Algo deu errado",
    description: "Ocorreu um erro inesperado. Tente novamente ou volte para a pagina inicial.",
    tryAgain: "Tentar novamente",
    goHome: "Ir ao inicio",
  },
};

const LOCALES = new Set(Object.keys(messages));

function getLocale(): string {
  if (typeof window === "undefined") return "en";
  const segment = window.location.pathname.split("/")[1];
  return segment && LOCALES.has(segment) ? segment : "en";
}

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("Root error:", error);
  }, [error]);

  const t = useMemo(() => messages[getLocale()], []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-[var(--c-text)]">
          {t.title}
        </h1>
        <p className="mb-6 text-[var(--c-text-2)]">{t.description}</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-[2px] border border-[var(--solana-green)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--solana-green)] transition-colors hover:bg-[var(--solana-green)] hover:text-black"
          >
            {t.tryAgain}
          </button>
          <a
            href="/"
            className="rounded-[2px] border border-[var(--c-border)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--c-text-2)] transition-colors hover:border-[var(--c-border-hovered)] hover:text-[var(--c-text)]"
          >
            {t.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}
