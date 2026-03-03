import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  Code,
  Trophy,
  Shield,
  Zap,
  Users,
  Globe,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Layers,
  Quote,
} from "lucide-react";
import {
  getAllCourses,
  getPlatformStats,
  getAllTracks,
  getAllDifficulties,
} from "@/lib/data-service";
import { LEARNING_PATHS } from "@/lib/constants";
import { difficultyStyle } from "@/lib/utils";
import { PARTNER_LOGO_MAP } from "@/components/icons/partner-logos";
import { CourseIllustration } from "@/components/icons/course-illustration";

/** Revalidate the landing page every hour via ISR */
export const revalidate = 3600;

const FEATURES = [
  {
    icon: Code,
    titleKey: "features.interactiveLessons.title" as const,
    descriptionKey: "features.interactiveLessons.description" as const,
    color: "text-brazil-teal",
  },
  {
    icon: Trophy,
    titleKey: "features.onChainCredentials.title" as const,
    descriptionKey: "features.onChainCredentials.description" as const,
    color: "text-brazil-gold",
  },
  {
    icon: Zap,
    titleKey: "features.streaksAndGamification.title" as const,
    descriptionKey: "features.streaksAndGamification.description" as const,
    color: "text-brazil-coral",
  },
  {
    icon: Shield,
    titleKey: "features.soulboundXP.title" as const,
    descriptionKey: "features.soulboundXP.description" as const,
    color: "text-st-green",
  },
  {
    icon: Users,
    titleKey: "features.learningPaths.title" as const,
    descriptionKey: "features.learningPaths.description" as const,
    color: "text-brazil-green",
  },
  {
    icon: Globe,
    titleKey: "features.creatorRewards.title" as const,
    descriptionKey: "features.creatorRewards.description" as const,
    color: "text-brazil-blue",
  },
];

const PATH_ICONS: Record<string, typeof Layers> = {
  Rocket: Sparkles,
  TrendingUp: TrendingUp,
  Anchor: Shield,
  Layers: Layers,
};

const PARTNER_NAMES = [
  "Solana",
  "Superteam",
  "Metaplex",
  "Helius",
  "Anchor",
  "Jito",
];

export default async function HomePage() {
  const [courses, t, stats, TRACKS, difficulties] = await Promise.all([
    getAllCourses(),
    getTranslations("landing"),
    getPlatformStats(),
    getAllTracks(),
    getAllDifficulties(),
  ]);

  const STATS = [
    {
      labelKey: "socialProof.learnersLabel" as const,
      value: stats.learnerCount,
    },
    { labelKey: "socialProof.coursesLabel" as const, value: stats.courseCount },
    {
      labelKey: "socialProof.credentialsLabel" as const,
      value: stats.credentialCount,
    },
    { labelKey: "socialProof.xpLabel" as const, value: stats.totalXpFormatted },
  ];
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-st-green-dark/30 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("hero.badge")}</span>
            </div>

            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:bg-muted hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {t("hero.exploreCourses")}
                <BookOpen className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <div className="text-2xl font-bold text-gradient-gold sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("paths.sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("paths.sectionSubtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_PATHS.map((path) => {
            const Icon = PATH_ICONS[path.icon] || Layers;
            return (
              <Link
                key={path.id}
                href={`/courses?path=${path.id}`}
                className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover-gold hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${path.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: path.color }} />
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {path.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {path.description}
                </p>
                <div
                  className="mt-4 flex items-center gap-1 text-sm font-medium"
                  style={{ color: path.color }}
                >
                  {t("paths.coursesCount", { count: path.courses.length })}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                {t("popularCourses.title")}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                {t("popularCourses.subtitle")}
              </p>
            </div>
            <Link
              href="/courses"
              className="hidden items-center gap-1 text-sm font-medium text-foreground hover:text-primary hover:underline sm:flex"
            >
              {t("popularCourses.viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group rounded-2xl border border-border bg-card transition-all duration-300 hover-gold hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
              >
                <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-st-green-dark to-primary/20">
                  <CourseIllustration
                    className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
                    trackColor={TRACKS[course.trackId]?.color ?? "#4a8c5c"}
                    variant={Number(course.id) - 1}
                  />
                  <div className="absolute left-3 top-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={difficultyStyle(
                        difficulties.find((d) => d.value === course.difficulty)?.color ?? "#888",
                      )}
                    >
                      {difficulties.find((d) => d.value === course.difficulty)?.label ?? course.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold group-hover:text-primary">
                    {course.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>
                        {t("popularCourses.lessonsCount", {
                          count: course.lessonCount,
                        })}
                      </span>
                      <span>{course.duration}</span>
                    </div>
                    <span className="font-medium text-xp">
                      {course.xpTotal} XP
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("popularCourses.enrolled", {
                        count: course.totalEnrollments.toLocaleString(),
                      })}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      {t("popularCourses.start")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary hover:underline"
            >
              {t("popularCourses.viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("testimonials.title")}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
            >
              <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-st-green to-brazil-teal text-sm font-bold text-white">
                  {(t(`testimonials.items.${i}.name`) as string)
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {t(`testimonials.items.${i}.name`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`testimonials.items.${i}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Logos */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("partners.title")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {PARTNER_NAMES.map((name) => {
              const Logo = PARTNER_LOGO_MAP[name];
              return (
                <div
                  key={name}
                  className="flex items-center gap-2 text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110"
                >
                  {Logo ? <Logo size={32} /> : null}
                  <span className="text-sm font-semibold">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("features.sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("features.sectionSubtitle")}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 hover:border-primary/20"
            >
              <feature.icon
                className={`h-8 w-8 ${feature.color} transition-transform duration-300 group-hover:scale-110`}
              />
              <h3 className="mt-4 font-heading text-lg font-semibold">
                {t(feature.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-st-green-dark via-primary/20 to-brazil-green/10 p-10 sm:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-brazil-gold/5 via-transparent to-transparent" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  {t("cta.button")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
