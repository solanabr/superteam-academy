import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ConnectButton } from "@/components/connect-wallet";
import { HeaderNav } from "@/components/header-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

export async function Header() {
  const tHeader = await getTranslations("header");
  const tMeta = await getTranslations("metadata");

  return (
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
          <HeaderNav href="/courses" label={tHeader("courses")} />
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
