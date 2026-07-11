"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const SECTIONS = ["publish", "deploy", "moderation", "status"] as const;

/**
 * Persistent admin console navigation: a left rail on desktop, horizontal
 * tabs on mobile. Rendered by the admin `layout.tsx` only for authenticated
 * sessions. Native `<Link>`s keep it keyboard-navigable; the active section
 * is marked with `aria-current="page"` (startsWith match so sub-routes stay
 * highlighted). Labels come from the `admin.nav` namespace.
 */
export function AdminNav() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("console.navLabel")} className="shrink-0 md:w-48">
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {SECTIONS.map((section) => {
          const href = `/${locale}/admin/${section}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={section}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-[var(--r-md)] px-3 py-2 text-sm font-semibold no-underline transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  isActive
                    ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                    : "text-[var(--text-3)] hover:bg-[var(--card)] hover:text-[var(--text-2)]"
                )}
              >
                {t(`nav.${section}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
