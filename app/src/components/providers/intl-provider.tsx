"use client";

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import { useUserStore } from "@/lib/store/user-store";
import { NextIntlClientProvider } from "next-intl";
import { useMemo } from "react";

const dictionaries = {
  en,
  "pt-BR": ptBR,
  es,
} as const;

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const locale = useUserStore((state) => state.locale);

  const messages = useMemo(() => dictionaries[locale], [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
