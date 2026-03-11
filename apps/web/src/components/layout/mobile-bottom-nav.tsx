"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { House, Book, ChatCircle, Trophy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";

const navItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "community", icon: ChatCircle, href: "/community" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
] as const;

const publicNavItems = [
  { key: "courses", icon: Book, href: "/courses" },
  { key: "community", icon: ChatCircle, href: "/community" },
  { key: "leaderboard", icon: Trophy, href: "/leaderboard" },
] as const;

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const isLoggedIn = !!user && !!profile;
  const items = isLoggedIn ? navItems : publicNavItems;

  // Hide on lesson pages (own toolbar) and landing/marketing pages
  const isLessonPage = /\/courses\/[^/]+\/lessons\//.test(pathname);
  const stripLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
  const isLandingOrMarketing = stripLocale === "" || stripLocale === "/";
  if (isLessonPage || isLandingOrMarketing) return null;

  return (
    <nav
      className="mobile-bottom-nav lg:hidden"
      aria-label={tA11y("platformNavigation")}
    >
      {items.map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const isActive = pathname.startsWith(fullHref);
        const Icon = item.icon;

        return (
          <Link
            key={item.key}
            href={fullHref}
            aria-current={isActive ? "page" : undefined}
            className={cn("mobile-bottom-nav-item", isActive && "active")}
          >
            <Icon size={22} weight={isActive ? "fill" : "regular"} />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
