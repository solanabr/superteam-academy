"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

  // Simple inline translations since we can't use next-intl outside [locale] layout
  const translations: Record<
    string,
    { title: string; description: string; tryAgain: string; goHome: string }
  > = {
    en: {
      title: "Something Went Wrong",
      description: "An unexpected error occurred.",
      tryAgain: "Try Again",
      goHome: "Go Home",
    },
    "pt-BR": {
      title: "Algo Deu Errado",
      description: "Ocorreu um erro inesperado.",
      tryAgain: "Tentar Novamente",
      goHome: "Voltar ao Início",
    },
    es: {
      title: "Algo Salió Mal",
      description: "Ocurrió un error inesperado.",
      tryAgain: "Intentar de Nuevo",
      goHome: "Ir al Inicio",
    },
  };
  const t = translations[locale] ?? translations["en"]!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <h1 className="font-display text-6xl font-black text-primary">Oops!</h1>
      <p className="mt-4 text-xl font-semibold text-text">{t.title}</p>
      <p className="mt-2 max-w-md text-text-3">{t.description}</p>
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t.tryAgain}
        </button>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center rounded-lg border-[2.5px] border-border px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-subtle"
        >
          {t.goHome}
        </Link>
      </div>
    </div>
  );
}
