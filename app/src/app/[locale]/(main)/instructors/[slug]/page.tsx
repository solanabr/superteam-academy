import Image from "next/image";
import { RemoteImage } from "@/components/remote-image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getInstructorBySlug,
  getAllInstructors,
  getCoursesByInstructorSlug,
  getDifficultyLabel,
  localize,
} from "@/services/cms";
import { notFound } from "next/navigation";
import { BookOpen, Clock } from "lucide-react";
import { SocialIcon, getSocialPlatform } from "@/components/social-icons";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const instructors = await getAllInstructors();
  return instructors.map((i) => ({ slug: i.slug }));
}

export default async function InstructorProfilePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations("instructors");
  const instructor = await getInstructorBySlug(slug);
  if (!instructor) notFound();

  const instructorCourses = await getCoursesByInstructorSlug(slug, locale);

  return (
    <div className="container py-8">
      <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-start">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-4 border-[#008c4C] bg-muted md:h-48 md:w-48">
          <Image
            src={instructor.avatar}
            alt={instructor.name}
            fill
            className="object-cover"
            sizes="192px"
            priority
            unoptimized
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            {instructor.name}
          </h1>
          {instructor.specialties && instructor.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {instructor.specialties.map((s) => (
                <span
                  key={s}
                  className="card-badge rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-white dark:text-[#2f6b3f]">
            {instructor.bio}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {instructor.links?.map((link) => {
              const platform = getSocialPlatform(link.label, link.url);
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {platform ? (
                    <SocialIcon platform={platform} className="h-5 w-5" />
                  ) : (
                    link.label
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-6 text-center text-xl font-semibold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("coursesTaught")}
        </h2>
        {instructorCourses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("noCoursesYet")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {instructorCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="h-full overflow-hidden transition-colors hover:border-primary/50 hover:bg-card/80">
                  <div className="relative h-36 w-full overflow-hidden bg-muted">
                    <RemoteImage src={course.thumbnail} alt={course.title} />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="card-badge rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                        {course.track}
                      </span>
                      <span className="card-badge rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                        {getDifficultyLabel(course.difficulty)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      {localize(locale, course.slug, "title", course.title)}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-black">
                      {localize(
                        locale,
                        course.slug,
                        "description",
                        course.description,
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-3 text-sm text-sky-600">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {getDifficultyLabel(course.difficulty)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.totalDurationMinutes} min
                      </span>
                      <span className="font-medium">{course.xpTotal} XP</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full card-button bg-blue-500 text-white hover:bg-blue-600 hover:text-white transition-transform active:scale-[0.98]"
                    >
                      {t("seeCourse")}
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
