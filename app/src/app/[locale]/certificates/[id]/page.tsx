import { setRequestLocale, getTranslations } from "next-intl/server";
import { CertificateView } from "@/components/certificates/CertificateView";

export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("certificate");
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

export default async function CertificatePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <CertificateView assetId={id} />;
}
