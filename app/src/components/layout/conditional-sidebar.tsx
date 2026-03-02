"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";

// Exact pathnames where the sidebar should appear.
// Deep sub-routes (course detail, lesson player, public profiles, etc.) are intentionally excluded.
const SIDEBAR_ROUTES = new Set([
  "/courses",
  "/dashboard",
  "/challenges",
  "/leaderboard",
  "/discussions",
  "/notifications",
  "/profile",
  "/settings",
]);

export function ConditionalSidebar() {
  const pathname = usePathname();
  if (!SIDEBAR_ROUTES.has(pathname)) return null;
  return <AppSidebar />;
}
