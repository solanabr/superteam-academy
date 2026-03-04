import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { getAllCourses, type SanityCourse } from "@/lib/sanity/queries";
import { routing } from "@/i18n/routing";
import logger from "@/lib/logger";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "courses" });
  const title = t("title");
  const description = t("subtitle");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export const revalidate = 60;

export default async function CoursesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "courses" });

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialTrack =
    typeof resolvedSearchParams.track === "string" ? resolvedSearchParams.track : "all";

  let courses: SanityCourse[] = [];
  let loadError = false;

  try {
    courses = await getAllCourses(locale);
    // Fallback: if no courses for this locale, try the default locale (primary content locale)
    if (courses.length === 0 && locale !== routing.defaultLocale) {
      courses = await getAllCourses(routing.defaultLocale);
    }
  } catch (err) {
    logger.error("[CoursesPage] Failed to load courses:", err);
    loadError = true;
  }

  // Compute stats from courses for the header pills
  const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length ?? 0), 0);
  const totalXP = courses.reduce(
    (sum, c) => sum + (c.xpPerLesson ?? 0) * (c.lessons?.length ?? 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* ── Hero header ── */}
      <div className="relative mb-12 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 px-8 py-12">
        {/* Dot grid overlay */}
        <div className="courses-dot-grid pointer-events-none absolute inset-0 opacity-60" />

        {/* Decorative blockchain-node SVG */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.09]"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central node */}
          <circle cx="130" cy="130" r="18" stroke="currentColor" strokeWidth="2.5" />
          {/* Outer nodes */}
          <circle cx="130" cy="40"  r="11" stroke="currentColor" strokeWidth="2" />
          <circle cx="207" cy="85"  r="11" stroke="currentColor" strokeWidth="2" />
          <circle cx="207" cy="175" r="11" stroke="currentColor" strokeWidth="2" />
          <circle cx="130" cy="220" r="11" stroke="currentColor" strokeWidth="2" />
          <circle cx="53"  cy="175" r="11" stroke="currentColor" strokeWidth="2" />
          <circle cx="53"  cy="85"  r="11" stroke="currentColor" strokeWidth="2" />
          {/* Spokes */}
          <line x1="130" y1="112" x2="130" y2="51"  stroke="currentColor" strokeWidth="1.5" />
          <line x1="130" y1="112" x2="198" y2="91"  stroke="currentColor" strokeWidth="1.5" />
          <line x1="130" y1="148" x2="198" y2="169" stroke="currentColor" strokeWidth="1.5" />
          <line x1="130" y1="148" x2="130" y2="209" stroke="currentColor" strokeWidth="1.5" />
          <line x1="130" y1="148" x2="62"  y2="169" stroke="currentColor" strokeWidth="1.5" />
          <line x1="130" y1="112" x2="62"  y2="91"  stroke="currentColor" strokeWidth="1.5" />
          {/* Angled accent lines */}
          <line x1="20"  y1="20"  x2="70"  y2="50"  stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="240" y1="20"  x2="190" y2="50"  stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="20"  y1="240" x2="70"  y2="210" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="240" y1="240" x2="190" y2="210" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>

        {/* Content */}
        <div className="relative z-10 space-y-5">
          <h1 className="gradient-text text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">{t("subtitle")}</p>

          {/* Stat pills — only shown when courses are available */}
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="courses-stat-pill">
                <span className="courses-stat-pill-dot diff-dot-beginner" />
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </span>
              {totalLessons > 0 && (
                <span className="courses-stat-pill">
                  <span className="courses-stat-pill-dot" style={{ background: "hsl(189 100% 50%)" }} />
                  {totalLessons} lessons
                </span>
              )}
              {totalXP > 0 && (
                <span className="courses-stat-pill">
                  <span className="courses-stat-pill-dot" style={{ background: "hsl(43 96% 52%)" }} />
                  {totalXP.toLocaleString()}+ XP available
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <CourseGrid courses={courses} error={loadError} initialTrack={initialTrack} />
    </div>
  );
}
