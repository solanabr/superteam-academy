import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { getAllCourses, type SanityCourse } from "@/lib/sanity/queries";

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
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

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let courses: SanityCourse[];
  try {
    courses = await getAllCourses(locale);
  } catch {
    courses = [];
  }

  return <Dashboard courses={courses} />;
}
