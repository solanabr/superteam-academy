import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WalletStatus } from "@/components/layout/wallet-status";

export function Header(): React.ReactElement {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-archivo text-lg font-semibold text-foreground">
          Superteam Academy
        </Link>
        <nav className="flex items-center gap-4">
          <WalletStatus />
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
