"use client";

import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "./Navbar";

const APP_PATHS = ["/dashboard", "/courses", "/leaderboard", "/challenges", "/discussions", "/certificates", "/settings", "/admin"];
const TEST_PATHS = ["/test"];
const HIDE_NAVBAR_PATHS = ["/studio", "/structure", "/test-playground"];

function isAppRoute(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === "/profile") return true;
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
  const { connected } = useWallet();

  if (isTestRoute(pathname) || isHideNavbarRoute(pathname)) return null;
  if (connected && isAppRoute(pathname)) return null;
  return <Navbar />;
}
