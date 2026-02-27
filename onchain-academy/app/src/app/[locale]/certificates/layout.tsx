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
  const title = t("credentialsTitle");
  const description = t("credentialsDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/certificates`,
      languages: {
        en: `${BASE_URL}/en/certificates`,
        "pt-BR": `${BASE_URL}/pt-br/certificates`,
        es: `${BASE_URL}/es/certificates`,
        "x-default": `${BASE_URL}/en/certificates`,
      },
    },
  };
}

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
