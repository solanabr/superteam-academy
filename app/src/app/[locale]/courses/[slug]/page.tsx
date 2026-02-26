import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  fetchCourseBySlug,
  fetchCourses,
  getCourseById,
} from "@/lib/services/courses";
import { EnrollSection } from "./enroll-section";
import { CourseProgressBar } from "./course-progress-bar";
import { TRACK_LABELS } from "@/lib/constants";
import { locales } from "@/i18n/config";
import { ModuleAccordion } from "./module-accordion";

export const revalidate = 3600;

export async function generateStaticParams() {
  const courses = await fetchCourses();
  return courses.flatMap((course) =>
    locales.map((locale) => ({ locale, slug: course.slug })),
  );
}

const BASE_URL = "https://superteam-academy.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await fetchCourseBySlug(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: `${course.title} | Superteam Academy`,
      description: course.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} | Superteam Academy`,
      description: course.description,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/courses/${slug}`,
      languages: {
        en: `${BASE_URL}/en/courses/${slug}`,
        "pt-BR": `${BASE_URL}/pt-br/courses/${slug}`,
        es: `${BASE_URL}/es/courses/${slug}`,
        "x-default": `${BASE_URL}/en/courses/${slug}`,
      },
    },
  };
}

const COURSE_NUM_MAP: Record<string, string> = {
  "intro-to-solana": "01",
  "anchor-development": "02",
  "frontend-with-react": "03",
  "defi-fundamentals": "04",
  "solana-security": "05",
  "mobile-solana-react-native": "06",
};

const REVIEW_DATA = [
  {
    name: "Ana P.",
    initial: "A",
    rating: 5,
    comment:
      "Excellent course structure. The challenges are practical and the progression feels natural.",
    date: "2 weeks ago",
  },
  {
    name: "Carlos R.",
    initial: "C",
    rating: 4,
    comment:
      "Great content for getting started with Solana. Would love more advanced topics in future modules.",
    date: "1 month ago",
  },
  {
    name: "Sofia L.",
    initial: "S",
    rating: 5,
    comment:
      "The best Solana learning resource I've found. The on-chain credentials are a nice touch.",
    date: "1 month ago",
  },
];

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const course = await fetchCourseBySlug(slug);
  if (!course) notFound();

  const t = await getTranslations("courses");
  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const totalXP = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((s, l) => s + l.xpReward, 0),
    0,
  );
  const courseNum = COURSE_NUM_MAP[slug] ?? "01";

  return (
    <div style={{ background: "var(--background)" }}>
      {/* ═══ HERO ═══ */}
      <section className="sa-course-hero">
        <div className="sa-course-ghost">{courseNum}</div>

        <div
          className="sa-fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <span className="sa-course-meta-tag">
            {TRACK_LABELS[course.track]}
          </span>
          <span className="sa-course-meta-tag accent">{course.difficulty}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              color: "var(--c-text-muted)",
            }}
          >
            MODULE {courseNum}
          </span>
        </div>

        <h1
          className="sa-course-title sa-fade-up sa-fade-d1"
          style={{ marginBottom: "32px", maxWidth: "900px" }}
        >
          {course.title}
        </h1>

        <p className="sa-course-desc sa-fade-up sa-fade-d2">
          {course.description}
        </p>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <div className="sa-stats-strip sa-fade-up sa-fade-d3">
        <div className="sa-stat-cell">
          <div className="sa-stat-value">
            {totalLessons}
            <span className="sa-stat-unit">{t("lessons")}</span>
          </div>
          <div className="sa-stat-label">Course length</div>
        </div>
        <div className="sa-stat-cell">
          <div className="sa-stat-value">
            {course.duration.replace(/\s*hours?\s*/i, "")}
            <span className="sa-stat-unit">hrs</span>
          </div>
          <div className="sa-stat-label">Estimated time</div>
        </div>
        <div className="sa-stat-cell">
          <div
            className="sa-stat-value"
            style={{ color: "var(--xp)" }}
          >
            {totalXP}
            <span className="sa-stat-unit">XP</span>
          </div>
          <div className="sa-stat-label">Total rewards</div>
        </div>
        <div className="sa-stat-cell">
          <div className="sa-stat-value">
            {course.enrolledCount > 0
              ? course.enrolledCount.toLocaleString()
              : "---"}
          </div>
          <div className="sa-stat-label">{t("enrolled")}</div>
        </div>
      </div>

      {/* ═══ PROGRESS ═══ */}
      <CourseProgressBar courseId={course.id} />

      {/* ═══ ENROLL ═══ */}
      <EnrollSection
        courseId={course.id}
        slug={slug}
        totalLessons={totalLessons}
        totalCompletions={course.totalCompletions}
        creator={course.creator}
        t={{
          enrollNow: t("enrollNow"),
          completions: t("completions"),
          by: t("by"),
          enrolled: t("enrolled"),
          completed: "Completed",
        }}
      />

      {course.prerequisiteId && (
        <div
          style={{
            padding: "0 clamp(20px, 8vw, 120px)",
            background: "var(--background)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "var(--c-text-muted)",
            }}
          >
            {t("prerequisite")}{" "}
            <Link
              href={`/${locale}/courses/${getCourseById(course.prerequisiteId!)?.slug}`}
              style={{ color: "var(--nd-highlight-orange)", textDecoration: "underline" }}
            >
              {getCourseById(course.prerequisiteId!)?.title}
            </Link>
          </p>
        </div>
      )}

      {/* ═══ MODULES ═══ */}
      <section className="sa-modules-section">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: "var(--c-text-muted)",
            marginBottom: "48px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--c-border-subtle)",
          }}
        >
          Course Content &middot; {course.modules.length} Modules &middot;{" "}
          {totalLessons} Lessons &middot; {course.duration}
        </div>

        <ModuleAccordion modules={course.modules} locale={locale} slug={slug} />
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section className="sa-reviews-section">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: "var(--c-text-muted)",
            marginBottom: "40px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--c-border-subtle)",
          }}
        >
          {t("studentReviews")}
        </div>
        {REVIEW_DATA.map((review) => (
          <div className="sa-review-card" key={review.name}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-brand)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  {review.initial}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                  }}
                >
                  {review.name}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "var(--c-text-muted)",
                }}
              >
                {review.date}
              </span>
            </div>
            <div style={{ display: "flex", gap: "3px", marginBottom: "10px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    color: i < review.rating ? "#FFC526" : "rgba(255,255,255,0.1)",
                    fontSize: "14px",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--c-text-body)",
                fontWeight: 300,
              }}
            >
              {review.comment}
            </p>
          </div>
        ))}

        {/* Discuss this course */}
        <div
          style={{
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid var(--c-border-subtle)",
            textAlign: "center",
          }}
        >
          <Link
            href={`/${locale}/community?course=${slug}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "var(--nd-highlight-orange)",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            Discuss this course in the community →
          </Link>
        </div>
      </section>
    </div>
  );
}
