'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocale } from "next-intl";

export default function LandingHeader() {
  const locale = useLocale();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground">
              Superteam Academy
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href={`/${locale}/courses`}>
              <Button variant="ghost" size="sm">Courses</Button>
            </Link>
            <Link href={`/${locale}/leaderboard`}>
              <Button variant="ghost" size="sm">Leaderboard</Button>
            </Link>
            <Link href={`/${locale}/dashboard`}>
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href={`/${locale}/community`}>
              <Button variant="ghost" size="sm">Community</Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href={`/${locale}/onboarding`}>
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
