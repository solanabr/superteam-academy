"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hasInstructorNft } from "@/lib/instructor";
import type { Course } from "@/data/courses";
import { localize } from "@/data/courses-i18n";
import { Plus, BookOpen } from "lucide-react";

interface DashboardInstructorPanelProps {
  courses: Course[];
}

export function DashboardInstructorPanel({
  courses,
}: DashboardInstructorPanelProps) {
  const { publicKey } = useAuth();
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const isInstructor = publicKey && hasInstructorNft(publicKey.toBase58());

  if (!publicKey || !isInstructor) return null;

  const instructorCourses = courses; // em produção: filtrar por instrutor (wallet → instructorSlug)

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-semibold drop-shadow-md">
        {t("instructorPanel")}
      </h2>
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("manageCourses")}
          </CardTitle>
          <CardDescription>{t("manageCoursesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button asChild className="gap-2" size="sm">
            <Link href="/dashboard/instructor/courses/new">
              <Plus className="h-4 w-4" />
              {t("createNewCourse")}
            </Link>
          </Button>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {t("yourCourses")}
            </h3>
            {instructorCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noInstructorCoursesYet")}
              </p>
            ) : (
              <ul className="space-y-2">
                {instructorCourses.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${c.slug}`}
                      className="text-sm text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {localize(locale, c.slug, "title", c.title)}
                    </Link>
                  </li>
                ))}
                {instructorCourses.length > 5 && (
                  <li className="text-sm text-muted-foreground">
                    +{instructorCourses.length - 5} {t("more")}
                  </li>
                )}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
