"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

const APP_PATHS = ["/dashboard", "/courses", "/leaderboard", "/profile", "/certificates", "/settings", "/admin"];
const TEST_PATHS = ["/test"];
const HIDE_NAVBAR_PATHS = ["/studio", "/structure"];

function isAppRoute(pathname: string | null) {
  if (!pathname) return false;
  return APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isTestRoute(pathname: string | null) {
  if (!pathname) return false;
  return TEST_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isHideNavbarRoute(pathname: string | null) {
  if (!pathname) return false;
  return HIDE_NAVBAR_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function NavbarWrapper() {
  const pathname = usePathname();
  if (isAppRoute(pathname) || isTestRoute(pathname) || isHideNavbarRoute(pathname)) return null;
  return <Navbar />;
}
