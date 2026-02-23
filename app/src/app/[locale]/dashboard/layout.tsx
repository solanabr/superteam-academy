import type { Metadata } from "next";

const BASE_URL = "https://superteam-academy.vercel.app";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Track your Solana learning progress, XP, streaks, and achievements on your personalized dashboard.",
  openGraph: {
    title: "Dashboard | Superteam Academy",
    description:
      "Track your Solana learning progress, XP, streaks, and achievements on your personalized dashboard.",
  },
  alternates: {
    canonical: `${BASE_URL}/en/dashboard`,
    languages: {
      en: "/en/dashboard",
      "pt-BR": "/pt-br/dashboard",
      es: "/es/dashboard",
    },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
