// app/src/app/(dashboard)/layout.tsx
"use client";   // ← ОБЯЗАТЕЛЬНО в самом верху!

import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthGuard } from "@/components/auth-guard";
import {LanguageSwitcher} from "@/components/language-switcher"
import {NotificationsPopover} from "@/components/notifications-popover"

// Провайдеры
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    //<SessionProvider>
      <Providers>
        <div className="flex min-h-screen flex-col space-y-6">
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="container flex h-16 items-center justify-between py-4">
              
              {/* Логотип и Мобильное Меню */}
              <div className="flex gap-4 md:gap-10 items-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="flex flex-col gap-4 py-4">
                      <Link href="/" className="font-bold text-xl mb-4">
                        Superteam Academy
                      </Link>
                      <MainNav />
                    </div>
                  </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center space-x-2">
                  <span className="inline-block font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent hidden md:inline-block">
                    Superteam Academy
                  </span>
                  <span className="inline-block font-bold text-xl md:hidden">
                    SA
                  </span>
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

          <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
            <aside className="hidden w-[200px] flex-col md:flex">
              <MainNav />
            </aside>
            
            <main className="flex w-full flex-1 flex-col overflow-hidden pb-10">
              <AuthGuard>
                {children}
              </AuthGuard>
            </main>
          </div>
        </div>
      </Providers>
    //</SessionProvider>
  );
}