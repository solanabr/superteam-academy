import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";
import { ConnectButton } from "@/components/connect-wallet";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();
  const tHeader = await getTranslations("header");
  const tMeta = await getTranslations("metadata");

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <TooltipProvider>
          <header className="border-b border-border px-4 py-3">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <Link href="/" aria-label={tHeader("goHome")}>
                <Image
                  src="/logo-green.svg"
                  alt={tMeta("title")}
                  width={176}
                  height={30}
                  className="h-8 w-auto dark:hidden"
                  priority
                />
                <Image
                  src="/logo-white.svg"
                  alt={tMeta("title")}
                  width={176}
                  height={30}
                  className="hidden h-8 w-auto dark:block"
                  priority
                />
              </Link>
              <nav className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/courses"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {tHeader("courses")}
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <ConnectButton />
              </div>
            </div>
          </header>
          {children}
          <Toaster />
        </TooltipProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
