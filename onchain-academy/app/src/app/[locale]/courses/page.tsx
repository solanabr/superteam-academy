import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchCourses } from "@/lib/services/courses";
import CourseCatalog from "./course-catalog";

const BASE_URL = "https://superteam-academy-gules.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const title = t("coursesTitle");
  const description = t("coursesDescription");

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Superteam Academy`,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/courses`,
      languages: {
        en: `${BASE_URL}/en/courses`,
        "pt-BR": `${BASE_URL}/pt-br/courses`,
        es: `${BASE_URL}/es/courses`,
        "x-default": `${BASE_URL}/en/courses`,
      },
    },
  };
}

export default async function CourseCatalogPage() {
  const courses = await fetchCourses();

  return <CourseCatalog courses={courses} />;
}
