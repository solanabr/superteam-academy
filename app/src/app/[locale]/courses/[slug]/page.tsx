import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CourseDetail } from "@/components/courses/CourseDetail";
import { getCourseBySlug, getAllCourses, type SanityCourse } from "@/lib/sanity/queries";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  let course: SanityCourse | null = null;
  try {
    course = await getCourseBySlug(slug, locale);
    if (!course && locale !== routing.defaultLocale) {
      course = await getCourseBySlug(slug, routing.defaultLocale);
    }
  } catch {
    // Sanity unavailable
  }
  if (!course) {
    const t = await getTranslations({ locale, namespace: "courses" });
    return { title: t("title") };
  }
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description,
    },
  };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    try {
      const courses = await getAllCourses(locale);
      for (const course of courses) {
        params.push({ locale, slug: course.slug });
      }
    } catch {
      // Sanity unavailable at build time — skip locale
    }
  }
  return params;
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let course: SanityCourse | null = null;
  try {
    course = await getCourseBySlug(slug, locale);
    // Fallback: if no content for this locale, try the default locale (primary content locale)
    if (!course && locale !== routing.defaultLocale) {
      course = await getCourseBySlug(slug, routing.defaultLocale);
    }
  } catch {
    // Sanity unavailable
  }

  if (!course) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "Superteam Academy",
      url: "https://superteam-academy.vercel.app",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      inLanguage: locale,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseDetail course={course} />
    </>
  );
}
