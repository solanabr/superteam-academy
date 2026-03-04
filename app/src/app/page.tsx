"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/locale-context";
import { COURSES, LEARNING_PATHS } from "@/services/course-data";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Award,
  Code2,
  Users,
  ArrowRight,
  Rocket,
  TrendingUp,
  Palette,
  Shield,
  BookOpen,
  Trophy,
  GraduationCap,
} from "lucide-react";

const PATH_ICONS: Record<string, typeof Rocket> = {
  rocket: Rocket,
  "trending-up": TrendingUp,
  palette: Palette,
  shield: Shield,
};

const FEATURES = [
  { key: "feature1", icon: Award },
  { key: "feature2", icon: Zap },
  { key: "feature3", icon: Code2 },
  { key: "feature4", icon: Users },
];

const STATS = [
  { key: "totalXpMinted", value: "2.4M+", icon: Zap },
  { key: "activeLearners", value: "1,200+", icon: Users },
  { key: "coursesAvailable", value: "6", icon: BookOpen },
  { key: "credentialsMinted", value: "970+", icon: GraduationCap },
];

export default function HomePage() {
  const { t } = useLocale();
  const featuredCourses = COURSES.filter((c) => c.isActive).slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />
          <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-500">
              <Zap className="h-4 w-4" />
              {t("common.beta")} &mdash; {t("footer.builtOn")} Solana
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero.title").split("Solana").map((part, i) =>
                i === 0 ? (
                  <span key={i}>
                    {part}
                    <span className="gradient-text">Solana</span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </h1>

            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg px-8"
              >
                <Link href="/courses">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link href="/courses">{t("hero.exploreCourses")}</Link>
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span>{t("hero.learnersCount", { count: "1,200" })}</span>
              <span className="h-4 w-px bg-border" />
              <span>{t("hero.coursesCount", { count: "6" })}</span>
              <span className="h-4 w-px bg-border" />
              <span>{t("hero.credentialsIssued", { count: "970" })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/40 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.key} className="text-center">
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-violet-500" />
                <div className="text-2xl font-bold sm:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {t(`landing.${stat.key}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Learning Paths */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">{t("landing.featuredPaths")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("landing.featuredPathsDesc")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {LEARNING_PATHS.map((path) => {
              const IconComponent = PATH_ICONS[path.icon] || Rocket;
              return (
                <Card
                  key={path.id}
                  className="group border-border/40 transition-all hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <IconComponent className="h-6 w-6 text-violet-500" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold group-hover:text-violet-500 transition-colors">
                      {path.title}
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                      {path.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {path.courses.length} {t("courses.lessons")}
                      </span>
                      <span>~{path.estimatedHours} {t("courses.hours")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Superteam Academy */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">{t("landing.whyTitle")}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.key} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                  <feature.icon className="h-7 w-7 text-violet-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t(`landing.${feature.key}Title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`landing.${feature.key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{t("courses.title")}</h2>
              <p className="mt-2 text-muted-foreground">
                {t("courses.subtitle")}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/courses">
                {t("common.viewAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 sm:p-12 lg:p-16">
            <div className="absolute inset-0">
              <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
            </div>
            <div className="relative mx-auto max-w-2xl text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-white/80" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                {t("hero.title")}
              </h2>
              <p className="mt-4 text-lg text-white/80">{t("hero.subtitle")}</p>
              <div className="mt-8">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-violet-600 hover:bg-white/90 text-lg px-8"
                >
                  <Link href="/courses">
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
