import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const BASE_URL = "https://superteam-academy.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const title = t("leaderboardTitle");
  const description = t("leaderboardDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/leaderboard`,
      languages: {
        en: `${BASE_URL}/en/leaderboard`,
        "pt-BR": `${BASE_URL}/pt-br/leaderboard`,
        es: `${BASE_URL}/es/leaderboard`,
        "x-default": `${BASE_URL}/en/leaderboard`,
      },
    },
  };
}

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
