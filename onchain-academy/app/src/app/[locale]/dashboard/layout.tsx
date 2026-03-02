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
  const title = t("dashboardTitle");
  const description = t("dashboardDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/dashboard`,
      languages: {
        en: `${BASE_URL}/en/dashboard`,
        "pt-BR": `${BASE_URL}/pt-br/dashboard`,
        es: `${BASE_URL}/es/dashboard`,
        "x-default": `${BASE_URL}/en/dashboard`,
      },
    },
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
