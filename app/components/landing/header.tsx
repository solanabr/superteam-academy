"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWallet } from "@/hooks/use-wallet";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Settings01Icon, Award01Icon, Logout01Icon } from "@hugeicons/core-free-icons";

const navLinks = [
  { href: "/courses", key: "courses" },
  { href: "/leaderboard", key: "leaderboard" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/community", key: "community" },
  { href: "/practice", key: "practice" },
] as const;

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { ready, authenticated, login, logout, address } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const getInitials = (addr: string) => {
    if (!addr) return '??';
    return addr.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground">
              {t("common.brandName")}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(`/${locale}${link.href}`);
              return (
                <Link key={link.href} href={`/${locale}${link.href}`}>
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm">
                    {t(`nav.${link.key}`)}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          {!ready ? (
            <Button size="lg" disabled>
              {t("common.loading")}
            </Button>
          ) : authenticated ? (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger>
                <div className="cursor-pointer rounded-full hover:opacity-80 transition-opacity">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(address || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {formatAddress(address || '')}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={`/${locale}/profile`} className="flex items-center gap-2 w-full">
                    <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={2} />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/${locale}/settings`} className="flex items-center gap-2 w-full">
                    <HugeiconsIcon icon={Settings01Icon} size={16} strokeWidth={2} />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/${locale}/certificates`} className="flex items-center gap-2 w-full">
                    <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={2} />
                    {t("certificates.heading")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 text-destructive">
                    <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={2} />
                    {t("common.logout")}
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="lg" onClick={login}>
              {t("common.connectWallet")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
