import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Profile } from "@/components/profile/Profile";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  const title = t("title");
  return {
    title,
    openGraph: {
      title,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Profile />;
}
