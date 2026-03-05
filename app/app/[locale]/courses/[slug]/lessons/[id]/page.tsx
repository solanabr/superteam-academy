import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { contentService } from "@/lib/services/sanity-content.service";
import { LessonViewClient } from "./lesson-view-client";

export default async function LessonPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string; id: string }>;
}) {
    const { locale, slug, id } = await params;
    setRequestLocale(locale);

    const course = await contentService.getCourseBySlug(slug);
    if (!course) notFound();

    // Find the lesson and its module
    let lessonData: { lesson: typeof course.modules[0]["lessons"][0]; moduleTitle: string } | null = null;
    for (const mod of course.modules) {
        const lesson = mod.lessons.find((l) => l.id === id);
        if (lesson) {
            lessonData = { lesson, moduleTitle: mod.title };
            break;
        }
    }
    if (!lessonData) notFound();

    const data = { course, ...lessonData };

    // Compute all lessons flat for navigation
    const allLessons = data.course.modules.flatMap((m) => m.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === id);

    return (
        <LessonViewClient
            course={data.course}
            lesson={data.lesson}
            moduleTitle={data.moduleTitle}
            currentIndex={currentIndex}
            totalLessons={allLessons.length}
            prevLessonId={currentIndex > 0 ? allLessons[currentIndex - 1].id : undefined}
            nextLessonId={currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : undefined}
        />
    );
}
