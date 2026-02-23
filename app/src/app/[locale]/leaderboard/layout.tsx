import type { Metadata } from "next";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top Solana developers ranked by XP. Compete with other learners and climb the leaderboard.",
  openGraph: {
    title: "Leaderboard | Superteam Academy",
    description:
      "See the top Solana developers ranked by XP. Compete with other learners and climb the leaderboard.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/leaderboard`,
    languages: {
      en: "/en/leaderboard",
      "pt-BR": "/pt-br/leaderboard",
      es: "/es/leaderboard",
    },
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
