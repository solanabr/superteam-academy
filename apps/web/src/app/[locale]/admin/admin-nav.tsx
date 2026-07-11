"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const SECTIONS = ["publish", "deploy", "moderation", "status"] as const;

/**
 * Best-effort pending-flags count for the "Moderation" nav badge. Reuses the
 * existing `GET /api/admin/flags` list route (no count-only sibling exists);
 * `.length` of the returned rows is the pending count. Purely additive to nav
 * render — it never throws into the tree, and a failed/zero fetch leaves the
 * badge hidden.
 */
function usePendingFlagCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/flags");
        if (!res.ok) return;
        const body = (await res.json()) as { flags?: unknown[] };
        if (active) setCount(body.flags?.length ?? 0);
      } catch {
        // Non-critical at-a-glance count; leave the badge hidden on error.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return count;
}

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
  const pendingFlags = usePendingFlagCount();

  return (
    <nav aria-label={t("console.navLabel")} className="shrink-0 md:w-48">
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {SECTIONS.map((section) => {
          const href = `/${locale}/admin/${section}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const showBadge = section === "moderation" && pendingFlags > 0;

          return (
            <li key={section}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 whitespace-nowrap rounded-[var(--r-md)] px-3 py-2 text-sm font-semibold no-underline transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                  isActive
                    ? "bg-[var(--primary-dim)] text-[var(--primary)]"
                    : "text-[var(--text-3)] hover:bg-[var(--card)] hover:text-[var(--text-2)]"
                )}
              >
                <span>{t(`nav.${section}`)}</span>
                {showBadge && (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-white">
                    {pendingFlags}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
