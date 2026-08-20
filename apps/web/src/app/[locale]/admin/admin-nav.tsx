"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

// "Courses" is the merged Publish + Deploy screen (the two used to be separate
// entries, which hid the fact that they are two steps of one flow). "Content"
// (#513 WS-C) is the read-only Quests/Achievements/Paths tab — appended, not
// inserted, so it doesn't reshuffle the existing three.
const SECTIONS = [
  "courses",
  "moderation",
  "insights",
  "status",
  "content",
] as const;

/**
 * Three states for the "Moderation" nav badge. `failed` exists because a
 * hidden badge means "queue is clear", and before #1132 a dead endpoint got
 * that same silent treatment — the nav then corroborated the panel's wrong
 * all-clear.
 */
type PendingFlagState =
  | { status: "loading" }
  | { status: "ready"; count: number }
  | { status: "failed" };

/**
 * Pending-flags count for the "Moderation" nav badge. Reuses the existing
 * `GET /api/admin/flags` list route (no count-only sibling exists); `.length`
 * of the returned rows is the pending count. Still purely additive to nav
 * render — it never throws into the tree — but a failure is now reported as
 * `failed` rather than collapsing into zero.
 */
function usePendingFlagCount(): PendingFlagState {
  const [state, setState] = useState<PendingFlagState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/flags");
        if (!res.ok) {
          if (active) setState({ status: "failed" });
          return;
        }
        const body = (await res.json()) as { flags?: unknown[] };
        if (active)
          setState({ status: "ready", count: body.flags?.length ?? 0 });
      } catch {
        if (active) setState({ status: "failed" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
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
          const badge = section === "moderation" ? pendingFlags : null;

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
                {/* Muted placeholder while the count is in flight, so
                    "not known yet" does not look like "queue is clear".
                    Decorative: the moderation screen carries the accessible
                    loading text, and a live region firing on every admin page
                    load would be pure noise. */}
                {badge?.status === "loading" && (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-[1.125rem] w-5 animate-pulse rounded-full bg-subtle"
                  />
                )}
                {/* Unknown, not zero. Neutral `streak` rather than `danger`,
                    and deliberately not a live region — this nav renders on
                    every admin screen, so an assertive announcement per
                    transient blip costs more than it buys. Clicking it lands
                    on Moderation, where the panel offers the real retry. */}
                {badge?.status === "failed" && (
                  <span
                    aria-label={t("nav.pendingFlagsUnknown")}
                    title={t("nav.pendingFlagsUnknown")}
                    className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full border border-streak bg-streak-light px-1.5 py-0.5 text-xs font-bold leading-none text-streak"
                  >
                    ?
                  </span>
                )}
                {badge?.status === "ready" && badge.count > 0 && (
                  <span
                    aria-label={t("nav.pendingFlags", { count: badge.count })}
                    className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-white"
                  >
                    {badge.count}
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
