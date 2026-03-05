import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@/components/analytics";
import {
  PostHogProviderWrapper,
  PostHogPageview,
} from "@/components/posthog-provider";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function isNotFoundError(e: unknown): boolean {
  const err = e as Error & { digest?: string };
  return Boolean(
    err?.digest &&
    (String(err.digest).includes("404") || err.digest === "NEXT_NOT_FOUND"),
  );
}

// Force dynamic rendering — wallet auth + localStorage state require SSR, not SSG.
// Also avoids next-intl config resolution failures in Next 16 build workers.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  let locale: string;
  let messages: AbstractIntlMessages = {};
  try {
    const resolved = await params;
    locale = resolved?.locale ?? routing.defaultLocale;
    if (!locale || !routing.locales.includes(locale as "pt" | "es" | "en")) {
      notFound();
    }
    setRequestLocale(locale);
    try {
      const m = await getMessages();
      messages = (m ?? {}) as AbstractIntlMessages;
    } catch {
      messages = {};
    }
  } catch (e) {
    if (isNotFoundError(e)) throw e;
    console.error("[LocaleLayout]", e);
    locale = routing.defaultLocale;
    setRequestLocale(locale);
    messages = {};
  }
  return (
    <NextIntlClientProvider messages={messages}>
      <PostHogProviderWrapper>
        {children}
        <PostHogPageview />
      </PostHogProviderWrapper>
      <Toaster />
      <Analytics />
    </NextIntlClientProvider>
  );
}
