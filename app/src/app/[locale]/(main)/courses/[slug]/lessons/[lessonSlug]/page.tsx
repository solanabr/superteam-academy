import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLesson, localize, localizeLesson } from "@/services/cms";
import "@/data/courses-i18n-content-1-3";
import "@/data/courses-i18n-content-4-6";
import "@/data/courses-i18n-content-7-9";
import { LessonView } from "./lesson-view";

interface Props {
  params: Promise<{ locale: string; slug: string; lessonSlug: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { locale, slug, lessonSlug } = await params;
  const data = await getLesson(slug, lessonSlug, locale);
  if (!data) notFound();
  const { course, module: mod, lesson } = data;

  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  return (
    <LessonView
      courseSlug={course.slug}
      courseTitle={localize(locale, course.slug, "title", course.title)}
      moduleTitle={localize(locale, mod.id, "title", mod.title)}
      lesson={localizeLesson(locale, lesson)}
      prevLesson={
        prevLesson
          ? {
              slug: prevLesson.slug,
              title: localize(locale, prevLesson.id, "title", prevLesson.title),
            }
          : null
      }
      nextLesson={
        nextLesson
          ? {
              slug: nextLesson.slug,
              title: localize(locale, nextLesson.id, "title", nextLesson.title),
            }
          : null
      }
      allLessons={allLessons.map((l) => ({
        slug: l.slug,
        title: localize(locale, l.id, "title", l.title),
        id: l.id,
      }))}
    />
  );
}
