"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { FlatButton } from "@/components/ui/flat-button";
import type { NavContent } from "@/lib/types/landing";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuthStore, type AuthState } from "@/store/auth-store";

interface NavbarProps {
  content: NavContent;
}

export function Navbar({ content }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const session = useAuthStore((s: AuthState) => s.session);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const isDark = mounted && theme === "dark";
  const logoSrc = isDark ? "/dark-logo.jpg" : "/light-logo.jpg";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-20 h-16 flex items-center justify-between px-6 md:px-8",
        "bg-nav-bg border-b-2 border-border",
        "backdrop-blur-sm transition-colors duration-200"
      )}
    >
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
            src={logoSrc}
            alt="Superteam Academy"
            fill
            className="object-cover"
            priority
            loading="eager"
          />
        </span>
      </Link>

      <ul className="hidden md:flex items-center gap-8 list-none">
        <li>
          <Link
            href="/#why"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            {content.about}
          </Link>
        </li>
        <li>
          <Link
            href="/#features"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            {content.platform}
          </Link>
        </li>
        <li>
          <Link
            href="/#how"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            {content.howItWorks}
          </Link>
        </li>
        <li>
          <Link
            href="/#community"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            {content.community}
          </Link>
        </li>
        <li>
          <Link
            href="/challenges"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            Challenges
          </Link>
        </li>
        <li>
          <Link
            href="/leaderboard"
            className="font-mono text-xs font-medium text-muted-foreground dark:text-black! hover:text-primary dark:hover:text-accent no-underline tracking-wide uppercase transition-colors duration-150"
          >
            Leaderboard
          </Link>
        </li>
      </ul>

      <div className="flex items-center gap-4">
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={cn(
            "size-10 rounded-none border-2 border-border bg-card",
            "shadow-(--shadow-flat) dark:shadow-(--shadow-flat-yellow)",
            "flex items-center justify-center text-foreground",
            "hover:opacity-90 transition-[opacity,box-shadow,background-color,border-color] duration-200"
          )}
          aria-label={content.toggleTheme}
        >
          {isDark ? (
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        {session ? (
          <FlatButton href="/dashboard" variant="outline" size="md">
            {content.dashboard}
          </FlatButton>
        ) : (
          <FlatButton href="/login" variant="primary" size="md">
            {content.startLearning}
          </FlatButton>
        )}
      </div>
    </nav>
  );
}
