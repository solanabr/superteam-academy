import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

const BASE_URL = "https://superteam-academy-gules.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const title = t("profileTitle");
  const description = t("profileDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/profile`,
      languages: {
        en: `${BASE_URL}/en/profile`,
        "pt-BR": `${BASE_URL}/pt-br/profile`,
        es: `${BASE_URL}/es/profile`,
        "x-default": `${BASE_URL}/en/profile`,
      },
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
