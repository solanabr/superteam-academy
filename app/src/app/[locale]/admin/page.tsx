import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title") };
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminDashboard />;
}
