"use client";

import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Adds top margin when user is not logged in on public pages (profile, leaderboard, discussions)
 * so content doesn't sit flush under the navbar.
 */
export function PublicPageTopMargin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { connected } = useWallet();

  const isPublicPage =
    pathname?.startsWith("/profile") ||
    pathname === "/leaderboard" ||
    pathname?.startsWith("/discussions") ||
    pathname === "/challenges";

  if (isPublicPage && !connected) {
    return <div className="pt-6 sm:pt-8">{children}</div>;
  }

  return <>{children}</>;
}
