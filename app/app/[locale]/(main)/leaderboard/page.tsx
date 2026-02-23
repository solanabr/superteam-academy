import type { Metadata } from "next";
import LeaderboardPage from "./leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top XP earners on Superteam Academy. Compete weekly, monthly, or all-time.",
};

export default function Page() {
  return <LeaderboardPage />;
}
