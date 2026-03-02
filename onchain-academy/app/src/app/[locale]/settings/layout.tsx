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
  const title = t("settingsTitle");
  const description = t("settingsDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/settings`,
      languages: {
        en: `${BASE_URL}/en/settings`,
        "pt-BR": `${BASE_URL}/pt-br/settings`,
        es: `${BASE_URL}/es/settings`,
        "x-default": `${BASE_URL}/en/settings`,
      },
    },
  };
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
