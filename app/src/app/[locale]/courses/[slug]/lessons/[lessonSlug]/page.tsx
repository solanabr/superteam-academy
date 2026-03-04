export const revalidate = 120;

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LessonView } from "@/components/lessons/LessonView";
import { getAllCourses, getLessonBySlug, getCourseBySlug } from "@/lib/sanity/queries";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string; lessonSlug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug, lessonSlug } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });
  let lesson = await getLessonBySlug(slug, lessonSlug, locale);
  if (!lesson && locale !== routing.defaultLocale) {
    lesson = await getLessonBySlug(slug, lessonSlug, routing.defaultLocale);
  }
  const title = `${lesson?.title ?? lessonSlug} | ${t("title")}`;
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

export async function generateStaticParams() {
  const params: { locale: string; slug: string; lessonSlug: string }[] = [];
  for (const locale of routing.locales) {
    try {
      const courses = await getAllCourses(locale);
      for (const course of courses) {
        for (const lesson of course.lessons ?? []) {
          params.push({ locale, slug: course.slug, lessonSlug: lesson.slug });
        }
      }
    } catch {
      // Sanity unavailable at build time — skip locale
    }
  }
  return params;
}

export default async function LessonPage({ params }: Props) {
  const { locale, slug, lessonSlug } = await params;
  setRequestLocale(locale);

  let lesson, course;
  try {
    [lesson, course] = await Promise.all([
      getLessonBySlug(slug, lessonSlug, locale),
      getCourseBySlug(slug, locale),
    ]);

    // Fallback: if no content for this locale, try the default locale (primary content locale)
    if ((!lesson || !course) && locale !== routing.defaultLocale) {
      [lesson, course] = await Promise.all([
        lesson ?? getLessonBySlug(slug, lessonSlug, routing.defaultLocale),
        course ?? getCourseBySlug(slug, routing.defaultLocale),
      ]);
    }
  } catch {
    notFound();
  }

  if (!lesson || !course) {
    notFound();
  }

  return <LessonView lesson={lesson} course={course} />;
}
