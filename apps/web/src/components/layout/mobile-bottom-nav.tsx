"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { House, Book, Brain, ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";

// LX-B13 (#583): leaderboard demoted out of primary nav at launch (reachable
// via user menu + footer). Restore when cohort leagues land (LX-B9).
// Review (LX-B5) is the mobile-first retrieval surface — a primary learning
// tab. Auth-only: it is absent from publicNavItems (the route is protected).
const navItems = [
  { key: "dashboard", icon: House, href: "/dashboard" },
  { key: "courses", icon: Book, href: "/courses" },
  { key: "review", icon: Brain, href: "/review" },
  { key: "community", icon: ChatCircle, href: "/community" },
] as const;

const publicNavItems = [
  { key: "courses", icon: Book, href: "/courses" },
  { key: "community", icon: ChatCircle, href: "/community" },
] as const;

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const isLoggedIn = !!user && !!profile;
  const items = isLoggedIn ? navItems : publicNavItems;

  // Hide on lesson pages — they carry their own toolbar.
  const isLessonPage = /\/courses\/[^/]+\/lessons\//.test(pathname);
  const stripLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
  const isLanding = stripLocale === "" || stripLocale === "/";
  // Landing: signed-out visitors keep the clean marketing page, but a
  // SIGNED-IN learner landing on `/` on a phone had no way into the platform
  // except the cramped header — show them the same tabs as everywhere else.
  if (isLessonPage || (isLanding && !isLoggedIn)) return null;

  return (
    <>
      {/* The nav is position:fixed, so on the landing page — whose layout,
          unlike the (platform) pages' pb-20, reserves no space for it — this
          in-flow spacer stops the last content (the footer) hiding behind
          the bar. Platform pages keep their own padding; no spacer there. */}
      {isLanding && (
        <div
          aria-hidden
          className="h-[calc(60px+env(safe-area-inset-bottom,0px))] lg:hidden"
        />
      )}
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
    </>
  );
}
