import Image from "next/image";
import { RemoteImage } from "@/components/remote-image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCourseBySlug,
  getDifficultyLabel,
  getDurationLabel,
  localize,
} from "@/services/cms";
import { Clock, BarChart2, Star, MessageSquare } from "lucide-react";
import { CourseEnrollButton, CourseModules } from "./course-interactive";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const stubReviews = [
  {
    id: 1,
    name: "Ahmad Al-Farsi",
    rating: 5,
    text: "Excellent course! The content is well-structured and the instructor explains everything clearly. Highly recommended for beginners.",
  },
  {
    id: 2,
    name: "Fatima Hassan",
    rating: 4,
    text: "Very informative and practical. I learned a lot of new concepts that I could apply immediately. Would love more advanced topics.",
  },
  {
    id: 3,
    name: "Omar Khalid",
    rating: 5,
    text: "One of the best courses I have taken. The modules are comprehensive and the pace is perfect for self-study.",
  },
];

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const course = await getCourseBySlug(slug, locale);
  if (!course) notFound();
  const t = await getTranslations("course");
  const tCommon = await getTranslations("common");

  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const firstLessonSlug =
    course.modules[0]?.lessons[0]?.slug ??
    course.modules[0]?.lessons[0]?.id ??
    "intro";

  // Pre-localize module/lesson data for the client component
  const localizedModules = course.modules.map((mod) => ({
    id: mod.id,
    title: localize(locale, mod.id, "title", mod.title),
    lessons: mod.lessons.map((lesson) => ({
      id: lesson.id,
      title: localize(locale, lesson.id, "title", lesson.title),
      slug: lesson.slug,
      type: lesson.type,
      durationMinutes: lesson.durationMinutes,
      xpReward: lesson.xpReward,
    })),
  }));

  return (
    <div className="container py-8">
      <div className="mb-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg bg-muted">
            <RemoteImage src={course.thumbnail} alt={course.title} />
          </div>
          <h1 className="mb-2 text-center text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            {localize(locale, course.slug, "title", course.title)}
          </h1>
          <p className="text-muted-foreground">
            {localize(
              locale,
              course.slug,
              "longDescription",
              course.longDescription,
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1 text-[hsl(var(--brand-logo-yellow))] dark:text-blue-500">
              <BarChart2 className="h-4 w-4" />
              {t("difficulty")}: {getDifficultyLabel(course.difficulty)}
            </span>
            <span className="flex items-center gap-1 text-[hsl(var(--brand-logo-yellow))] dark:text-blue-500">
              <Clock className="h-4 w-4" />
              {t("duration")}: {getDurationLabel(course.duration)}
            </span>
            <span className="font-medium text-sky-600">
              {course.xpTotal} XP
            </span>
          </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                </div>
                <div>
                  <CardTitle>{course.instructor.name}</CardTitle>
                  <CardDescription>{t("instructor")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CourseEnrollButton
                courseSlug={course.slug}
                courseTitle={localize(
                  locale,
                  course.slug,
                  "title",
                  course.title,
                )}
                firstLessonSlug={firstLessonSlug}
                xpTotal={course.xpTotal}
                totalLessons={totalLessons}
                moduleCount={course.modules.length}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("modules")}
        </h2>
        <CourseModules courseSlug={course.slug} modules={localizedModules} />
      </section>

      {/* Reviews section */}
      <section className="mt-12">
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            <MessageSquare className="mb-1 mr-2 inline-block h-5 w-5" />
            {t("reviews")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("reviewsDesc")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stubReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm italic text-muted-foreground">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{review.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
