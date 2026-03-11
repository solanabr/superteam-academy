"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

  // Simple inline translations since we can't use next-intl outside [locale] layout
  const translations: Record<
    string,
    { title: string; description: string; goHome: string }
  > = {
    en: {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist.",
      goHome: "Go Home",
    },
    "pt-BR": {
      title: "Página Não Encontrada",
      description: "A página que você procura não existe.",
      goHome: "Voltar ao Início",
    },
    es: {
      title: "Página No Encontrada",
      description: "La página que buscas no existe.",
      goHome: "Ir al Inicio",
    },
  };
  const t = translations[locale] ?? translations["en"]!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <h1 className="font-display text-8xl font-black text-primary">404</h1>
      <p className="mt-4 text-xl font-semibold text-text">{t.title}</p>
      <p className="mt-2 max-w-md text-text-3">{t.description}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        {t.goHome}
      </Link>
    </div>
  );
}
