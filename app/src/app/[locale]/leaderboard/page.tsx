import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";
import { getXpLeaderboard } from "@/lib/solana/helius";
import { getAllCourses } from "@/lib/sanity/queries";
import { XP_MINT } from "@/lib/solana/constants";
import type { TokenHolder } from "@/lib/solana/helius";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  const title = t("title");
  const description = t("subtitle");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const revalidate = 300;

export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialEntries: TokenHolder[] = [];
  if (XP_MINT) {
    try {
      initialEntries = await getXpLeaderboard(XP_MINT.toBase58());
    } catch {
      // Fall through — client will fetch on mount
    }
  }

  let courseNames: { slug: string; title: string }[] = [];
  try {
    const courses = await getAllCourses(locale);
    courseNames = courses.map((c) => ({ slug: c.slug, title: c.title }));
  } catch {
    // Fall through — course filter will show empty
  }

  return <Leaderboard initialEntries={initialEntries} courses={courseNames} />;
}
