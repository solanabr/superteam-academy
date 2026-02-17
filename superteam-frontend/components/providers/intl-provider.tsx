"use client";

import { NextIntlClientProvider } from "next-intl";
import { type ReactNode } from "react";

type IntlProviderProps = {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
};

export function IntlProvider({
  locale,
  messages,
  children,
}: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
