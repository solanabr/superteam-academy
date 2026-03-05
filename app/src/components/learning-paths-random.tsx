"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemoteImage } from "@/components/remote-image";
import { BookOpen, Award, Zap, type LucideIcon } from "lucide-react";

export type CourseForPath = {
  slug: string;
  title: string;
  description: string;
  xpTotal: number;
  thumbnail: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

const LEVEL_KEYS = {
  beginner: "pathBeginner" as const,
  intermediate: "pathIntermediate" as const,
  advanced: "pathAdvanced" as const,
};

const LEVEL_ICONS: Record<string, LucideIcon> = {
  beginner: BookOpen,
  intermediate: Zap,
  advanced: Award,
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const PATHS_TO_SHOW = 3;

type Props = { courses: CourseForPath[] };

export function LearningPathsRandom({ courses }: Props) {
  const t = useTranslations("landing");
  const [picked, setPicked] = useState<CourseForPath[]>(() =>
    courses.length <= PATHS_TO_SHOW ? courses : courses.slice(0, PATHS_TO_SHOW),
  );
  const coursesRef = useRef(courses);
  coursesRef.current = courses;
  useEffect(() => {
    const list = coursesRef.current;
    if (list.length <= PATHS_TO_SHOW) return;
    setPicked(shuffle([...list]).slice(0, PATHS_TO_SHOW));
  }, []);

  return (
    <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {picked.map((course) => {
        const Icon = LEVEL_ICONS[course.difficulty] ?? BookOpen;
        const levelKey = LEVEL_KEYS[course.difficulty];
        const href = `/courses/${course.slug}`;
        return (
          <Link
            key={course.slug}
            href={href}
            className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-2xl"
          >
            <Card className="h-full overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 active:translate-y-0">
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <RemoteImage
                  src={course.thumbnail}
                  alt={course.title}
                  className="transition duration-300 group-hover:scale-105"
                />
              </div>
              <CardHeader className="pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                    {t(levelKey)}
                  </span>
                  <Icon className="h-6 w-6 text-primary opacity-80 transition group-hover:opacity-100" />
                </div>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <span className="font-semibold text-sky-600">
                  {course.xpTotal} XP
                </span>
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold
                             border-[hsl(var(--brand-logo-yellow))] text-[hsl(var(--brand-logo-yellow))]
                             hover:bg-[hsl(var(--brand-logo-yellow))] hover:text-[hsl(0,0%,9%)]
                             dark:border-[hsl(var(--brand-logo-green))] dark:text-[hsl(var(--brand-logo-green))]
                             dark:hover:bg-[hsl(var(--brand-logo-green))] dark:hover:text-white
                             transition-colors"
                >
                  Ver curso
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
