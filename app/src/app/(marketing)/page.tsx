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
import {
  AnimatedSection,
  StaggerChildren,
  StaggerItem,
  CountUp,
} from "@/components/landing/animated-section";
import { GridBackground } from "@/components/landing/grid-background";
import {
  HeroFloatingElements,
  CTAFloatingElements,
  SectionFloatingElements,
} from "@/components/landing/floating-elements";
import { AppScreenshots } from "@/components/landing/app-screenshot";
import { CodePlayground } from "@/components/landing/code-playground";
import { InteractiveQuiz } from "@/components/landing/interactive-quiz";
import { FAQSection } from "@/components/landing/faq-section";

/** Revalidate the landing page every hour via ISR */
export const revalidate = 3600;

const FEATURES = [
  {
    icon: Code,
    titleKey: "features.interactiveLessons.title" as const,
    descriptionKey: "features.interactiveLessons.description" as const,
    color: "text-brazil-teal",
    bg: "bg-brazil-teal/10",
  },
  {
    icon: Trophy,
    titleKey: "features.onChainCredentials.title" as const,
    descriptionKey: "features.onChainCredentials.description" as const,
    color: "text-brazil-gold",
    bg: "bg-brazil-gold/10",
  },
  {
    icon: Zap,
    titleKey: "features.streaksAndGamification.title" as const,
    descriptionKey: "features.streaksAndGamification.description" as const,
    color: "text-brazil-coral",
    bg: "bg-brazil-coral/10",
  },
  {
    icon: Shield,
    titleKey: "features.soulboundXP.title" as const,
    descriptionKey: "features.soulboundXP.description" as const,
    color: "text-st-green",
    bg: "bg-st-green/10",
  },
  {
    icon: Users,
    titleKey: "features.learningPaths.title" as const,
    descriptionKey: "features.learningPaths.description" as const,
    color: "text-brazil-green",
    bg: "bg-brazil-green/10",
  },
  {
    icon: Globe,
    titleKey: "features.creatorRewards.title" as const,
    descriptionKey: "features.creatorRewards.description" as const,
    color: "text-brazil-blue",
    bg: "bg-brazil-blue/10",
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
      <GridBackground variant="lines">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-st-green-dark/50 via-st-green-dark/20 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-st-green/15 via-transparent to-transparent" />

          {/* Animated gradient orbs */}
          <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-orb" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-brazil-gold/5 blur-3xl animate-orb-delayed" />

          <HeroFloatingElements />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
            <AnimatedSection
              className="mx-auto max-w-3xl text-center"
              variant="scaleIn"
            >
              {/* Shimmer badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 py-1.5 text-sm text-primary animate-shimmer">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("hero.badge")}</span>
              </div>

              {/* Animated gradient title */}
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="text-gradient-animated">
                  {t("hero.title")}
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                {/* Glow pulse CTA */}
                <Link
                  href="/onboarding"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-st-green to-brazil-gold px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_0_#3d6e22,0_6px_12px_rgba(61,110,34,0.35)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#3d6e22,0_10px_20px_rgba(61,110,34,0.4)] active:translate-y-[2px] active:shadow-[0_0px_0_0_#3d6e22,0_2px_4px_rgba(61,110,34,0.2)] active:scale-[0.98] animate-glow-pulse"
                >
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/courses"
                  className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-8 py-3.5 text-base font-semibold transition-all duration-300 shadow-[0_4px_0_0_var(--color-border),0_6px_12px_rgba(0,0,0,0.1)] hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_var(--color-border),0_10px_20px_rgba(0,0,0,0.15)] hover:bg-muted hover:border-primary/30 active:translate-y-[2px] active:shadow-[0_0px_0_0_var(--color-border),0_2px_4px_rgba(0,0,0,0.08)] active:scale-[0.98]"
                >
                  {t("hero.exploreCourses")}
                  <BookOpen className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </GridBackground>

      {/* Stats Bar */}
      <AnimatedSection delay={0.1} variant="scaleIn">
        <section className="border-y border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
            {STATS.map((stat, i) => (
              <div
                key={stat.labelKey}
                className="text-center"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="text-2xl font-bold text-gradient-gold sm:text-3xl">
                  <CountUp value={String(stat.value)} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Learning Paths */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
        <SectionFloatingElements variant="a" />
        <AnimatedSection className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("paths.sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("paths.sectionSubtitle")}
          </p>
        </AnimatedSection>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_PATHS.map((path) => {
            const Icon = PATH_ICONS[path.icon] || Layers;
            return (
              <StaggerItem key={path.id}>
                <Link
                  href={`/courses?path=${path.id}`}
                  className="group relative block rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover-gold hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 card-hover-glow"
                >
                  <div className="relative z-10">
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300"
                      style={{ backgroundColor: `${path.color}15` }}
                    >
                      <Icon
                        className="h-6 w-6 animate-icon-bounce"
                        style={{ color: path.color }}
                      />
                    </div>
                    <h3 className="font-heading text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
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
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </section>

      {/* App Screenshots */}
      <AppScreenshots />

      {/* Featured Courses */}
      <section className="relative overflow-hidden">
        <SectionFloatingElements variant="b" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <AnimatedSection
            className="flex items-end justify-between"
            variant="slideLeft"
          >
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
              className="hidden items-center gap-1 text-sm font-medium text-foreground transition-all duration-300 hover:text-primary hover:gap-2 sm:flex"
            >
              {t("popularCourses.viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </AnimatedSection>

          <StaggerChildren className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <StaggerItem key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="group block rounded-2xl border border-border bg-card transition-all duration-300 hover-gold hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 card-hover-glow"
                >
                  <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gradient-to-br from-st-green-dark to-primary/20">
                    <CourseIllustration
                      className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-110"
                      trackColor={TRACKS[course.trackId]?.color ?? "#4a8c5c"}
                      variant={Number(course.id) - 1}
                    />
                    <div className="absolute left-3 top-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm"
                        style={difficultyStyle(
                          difficulties.find(
                            (d) => d.value === course.difficulty,
                          )?.color ?? "#888",
                        )}
                      >
                        {difficulties.find((d) => d.value === course.difficulty)
                          ?.label ?? course.difficulty}
                      </span>
                    </div>
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="relative z-10 p-5">
                    <h3 className="font-heading text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
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
              </StaggerItem>
            ))}
          </StaggerChildren>

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

      {/* Code Playground */}
      <CodePlayground />

      {/* Interactive Quiz */}
      <InteractiveQuiz />

      {/* Testimonials */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
        <SectionFloatingElements variant="c" />
        <AnimatedSection className="text-center" variant="scaleIn">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("testimonials.title")}
          </h2>
        </AnimatedSection>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <StaggerItem key={i}>
              <div className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 hover:border-primary/20 card-hover-glow">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10 transition-all duration-300 group-hover:text-primary/20" />
                <div className="relative z-10">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t(`testimonials.items.${i}.quote`)}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-st-green to-brazil-teal text-sm font-bold text-white shadow-lg shadow-st-green/20">
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
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Partner Logos — marquee */}
      <AnimatedSection>
        <section className="border-y border-border bg-card/30 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted-foreground">
              {t("partners.title")}
            </p>
          </div>
          <div className="relative py-6">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex animate-marquee whitespace-nowrap">
              {/* Double the list for seamless loop */}
              {[...PARTNER_NAMES, ...PARTNER_NAMES].map((name, idx) => {
                const Logo = PARTNER_LOGO_MAP[name];
                return (
                  <div
                    key={`${name}-${idx}`}
                    className="mx-8 flex items-center gap-2 text-muted-foreground transition-all duration-300 hover:text-foreground hover:scale-110 sm:mx-12"
                  >
                    {Logo ? <Logo size={32} /> : null}
                    <span className="text-sm font-semibold">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Features Grid */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
        <SectionFloatingElements variant="a" />
        <AnimatedSection className="text-center" variant="slideRight">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("features.sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("features.sectionSubtitle")}
          </p>
        </AnimatedSection>

        <StaggerChildren className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.titleKey}>
              <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 hover:border-primary/20 card-hover-glow">
                <div className="relative z-10">
                  <div
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${feature.bg} transition-all duration-300 group-hover:scale-110`}
                  >
                    <feature.icon
                      className={`h-6 w-6 ${feature.color} animate-icon-bounce`}
                    />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold transition-colors duration-300 group-hover:text-primary">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* CTA Section */}
      <GridBackground variant="lines">
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <AnimatedSection variant="scaleIn">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-st-green-dark via-primary/20 to-brazil-green/10 p-10 sm:p-16">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-brazil-gold/5 via-transparent to-transparent" />
                {/* CTA gradient orb */}
                <div className="absolute top-[-30%] right-[-10%] h-[300px] w-[300px] rounded-full bg-primary/10 blur-3xl animate-orb" />
                <CTAFloatingElements />
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
                      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-st-green to-brazil-gold px-8 py-3.5 text-base font-semibold text-white shadow-[0_4px_0_0_#3d6e22,0_6px_12px_rgba(61,110,34,0.35)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#3d6e22,0_10px_20px_rgba(61,110,34,0.4)] active:translate-y-[2px] active:shadow-[0_0px_0_0_#3d6e22,0_2px_4px_rgba(61,110,34,0.2)] active:scale-[0.98] animate-glow-pulse"
                    >
                      {t("cta.button")}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </GridBackground>
    </div>
  );
}
