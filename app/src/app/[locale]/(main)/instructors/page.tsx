import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllInstructors, getCoursesByInstructorSlug } from "@/services/cms";
import { ExternalLink, BookOpen } from "lucide-react";

export default async function InstructorsPage() {
  const t = await getTranslations("instructors");
  const instructors = await getAllInstructors();
  const courseCountMap = Object.fromEntries(
    await Promise.all(
      instructors.map(
        async (i) =>
          [i.slug, (await getCoursesByInstructorSlug(i.slug)).length] as const,
      ),
    ),
  );

  return (
    <div className="container py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => {
          const courseCount = courseCountMap[instructor.slug] ?? 0;
          return (
            <Link
              key={instructor.slug}
              href={`/instructors/${instructor.slug}`}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-2xl"
            >
              <Card className="instructor-card h-full overflow-hidden border-4 border-[hsl(var(--brand-logo-green))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group">
                <CardHeader className="pb-2 pt-6">
                  <div className="flex flex-row items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-sky-600 bg-muted">
                      <Image
                        src={instructor.avatar}
                        alt={instructor.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl">
                        {instructor.name}
                      </CardTitle>
                      {instructor.specialties &&
                        instructor.specialties.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-black">{instructor.bio}</p>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-sky-600">
                    <BookOpen className="h-4 w-4" />
                    {courseCount}{" "}
                    {courseCount === 1 ? t("course") : t("courses")}
                  </span>
                  <span className="card-button inline-flex items-center justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-600 hover:text-white">
                    {t("viewProfile")}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
