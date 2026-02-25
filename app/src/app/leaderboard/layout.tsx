import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
