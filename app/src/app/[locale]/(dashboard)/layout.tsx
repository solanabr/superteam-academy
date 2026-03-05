"use client";

import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationsPopover } from "@/components/notifications-popover";
import Image from "next/image";
import { Providers } from "@/components/providers";
import { useTranslations } from "next-intl";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("DashboardLayout");

  return (
    <Providers>
      <div className="flex min-h-screen flex-col space-y-6 bg-[#050505]">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-4 md:gap-10">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="border border-white/10 bg-black/30 md:hidden" aria-label={t("openMenu")}>
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="border-white/10 bg-zinc-950/95">
                  <div className="flex flex-col gap-4 py-4">
                    <Link href="/" className="font-bold text-xl mb-4 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                      Superteam Academy
                    </Link>
                    <MainNav />
                  </div>
                </SheetContent>
              </Sheet>

              <Link href="/" className="flex items-center space-x-3">
                <Image src="/icons/icon-192x192.png" alt="Superteam Academy Logo" width={32} height={32} className="rounded-md" />
                <span className="hidden bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent md:inline-block">
                  Superteam Academy
                </span>
                <span className="inline-block text-xl font-bold md:hidden">SA</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ModeToggle />
              <NotificationsPopover />
              <LanguageSwitcher />
              <UserNav />
            </div>
          </div>
        </header>

        <div className="container grid flex-1 gap-8 md:grid-cols-[240px_1fr]">
          <aside className="hidden w-[240px] flex-col md:flex">
            <MainNav />
          </aside>

          <main className="flex w-full flex-1 flex-col overflow-hidden pb-10">
            <AuthGuard>{children}</AuthGuard>
          </main>
        </div>
      </div>
    </Providers>
  );
}
