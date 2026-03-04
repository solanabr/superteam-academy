"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Menu } from "lucide-react";
import { Navbar } from "@/components/sections/landing/navbar";
import { Footer } from "@/components/sections/landing/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FlatButton } from "@/components/ui/flat-button";
import { Link } from "@/i18n/navigation";
import type { NavContent } from "@/lib/types/landing";
import { getWebLayoutContent } from "@/lib/content";
import Image from "next/image";
import { cn } from "@/lib/utils";

type WebLayoutClientProps = { children: ReactNode };

type MobileWebNavbarProps = {
  content: NavContent;
};

function MobileWebNavbar({ content }: MobileWebNavbarProps): ReactNode {
  const [open, set_open] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between border-b-2 border-border bg-nav-bg px-4 backdrop-blur-sm md:hidden">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-extrabold text-foreground no-underline [font-family:var(--font-archivo)] text-lg transition-colors duration-200"
      >
        <span
          className={cn(
            "relative w-32 h-10 shrink-0 overflow-hidden rounded-md border-2 border-border",
            "shadow-(--shadow-flat) dark:shadow-(--shadow-flat-yellow)",
            "transition-shadow duration-200"
          )}
        >
          <Image
            src="/light-logo.jpg"
            alt="Superteam Academy"
            fill
            className="object-cover"
            priority
            loading="eager"
          />
        </span>
      </Link>
      <LocaleSwitcher />

      <Sheet open={open} onOpenChange={set_open}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-none border-2 border-border bg-card text-foreground shadow-(--shadow-flat) transition-[opacity,box-shadow,background-color,border-color] duration-200 hover:opacity-90"
            aria-label={content.toggleTheme}
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-6 rounded-none border-l bg-background px-4 py-4">
          <nav className="mt-2 flex flex-col gap-3">
            <Link
              href="/#why"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              {content.about}
            </Link>
            <Link
              href="/#features"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              {content.platform}
            </Link>
            <Link
              href="/#how"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              {content.howItWorks}
            </Link>
            <Link
              href="/#community"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              {content.community}
            </Link>
            <Link
              href="/challenges"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-primary no-underline transition-colors duration-150"
            >
              Leaderboard
            </Link>
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <ThemeToggle />
            <FlatButton href="/login" variant="primary" size="md">
              {content.startLearning}
            </FlatButton>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

export function WebLayoutClient({ children }: WebLayoutClientProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const { nav, footer } = getWebLayoutContent(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollProgress />
      <div className="hidden md:block">
        <Navbar content={nav} />
      </div>
      <MobileWebNavbar content={nav} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer content={footer} />
    </div>
  );
}
