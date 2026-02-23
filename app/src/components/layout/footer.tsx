"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-white/10 bg-zinc-950/70 px-4 py-5 text-center text-xs text-zinc-400">
      {t("copyright")}
    </footer>
  );
}
