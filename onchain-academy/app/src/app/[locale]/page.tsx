import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchCourses } from "@/lib/services/courses";
import { LandingContent } from "./landing-content";

const BASE_URL = "https://app-seven-mu-27.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        "pt-BR": `${BASE_URL}/pt-br`,
        es: `${BASE_URL}/es`,
        "x-default": `${BASE_URL}/en`,
      },
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const courses = await fetchCourses();

  // Compute stats server-side — avoids serializing full course content (~80KB) to the client
  const stats = {
    courseCount: courses.length,
    totalLessons: courses.reduce((sum, c) => sum + c.lessonCount, 0),
    totalXP: courses.reduce((sum, c) => sum + c.xpReward, 0),
  };

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Superteam Academy Courses",
    description:
      "Solana development courses with on-chain credentials and XP rewards",
    numberOfItems: courses.length,
    itemListElement: courses.map((course, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: course.title,
        description: course.description,
        url: `${BASE_URL}/${locale}/courses/${course.slug}`,
        provider: {
          "@type": "Organization",
          name: "Superteam Academy",
          url: BASE_URL,
        },
        educationalLevel: course.difficulty,
        timeRequired: `PT${course.duration?.replace(/\D/g, "") || "2"}H`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <LandingContent stats={stats} locale={locale} />
    </>
  );
}
