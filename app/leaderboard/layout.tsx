import type { ReactNode } from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata(
  "Leaderboard | Superteam Academy",
  "Global rankings for Solana learners by XP.",
  "/leaderboard"
);

export default function LeaderboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
