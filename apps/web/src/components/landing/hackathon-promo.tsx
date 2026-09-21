"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { HackathonHero } from "./hackathon-hero";

/**
 * Route gate for the Solana Hackathon promo bar (owner 2026-09-21): it shows on
 * the landing page and the courses catalog, and nowhere else. Mounted once at
 * the top of the app shell's `<main>`, above each page's own gutter container,
 * so the bar stays full-bleed and flush under the header on both routes rather
 * than being boxed into a page's content column.
 */
export function HackathonPromo() {
  const pathname = usePathname();
  const locale = useLocale();

  // usePathname carries the locale prefix (e.g. "/en", "/en/courses"). Trim any
  // trailing slash so "/en/" and "/en" match the same route.
  const path = (pathname ?? "").replace(/\/+$/, "");
  const show = path === `/${locale}` || path === `/${locale}/courses`;

  if (!show) return null;
  return <HackathonHero />;
}
