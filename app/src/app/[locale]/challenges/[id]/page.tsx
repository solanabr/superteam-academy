import { setRequestLocale, getTranslations } from "next-intl/server";
import { CodeChallenge } from "@/components/challenges/CodeChallenge";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("challenge");
  const title = `${t("pageTitle")} ${id}`;
  return {
    title,
    openGraph: {
      title,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
    },
  };
}

export default async function ChallengePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <div className="h-[calc(100vh-4rem)]">
      <CodeChallenge challengeId={id} standalone />
    </div>
  );
}
