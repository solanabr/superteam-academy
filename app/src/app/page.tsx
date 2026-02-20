"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Award,
  Zap,
  Users,
  ArrowRight,
  BookOpen,
  Layers,
  Terminal,
  Palette,
  Globe,
  ChevronRight,
} from "lucide-react";
import { trackLabels } from "@/lib/constants";

const features = [
  { key: "interactive" as const, icon: Code2 },
  { key: "credentials" as const, icon: Award },
  { key: "xp" as const, icon: Zap },
  { key: "community" as const, icon: Users },
];

const tracks = [
  { id: 1, icon: BookOpen, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { id: 2, icon: Layers, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { id: 3, icon: Terminal, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { id: 4, icon: Palette, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { id: 5, icon: Globe, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
];

const stats = [
  { key: "learners" as const, value: "2,500+" },
  { key: "courses" as const, value: "25+" },
  { key: "credentials" as const, value: "1,200+" },
  { key: "xpAwarded" as const, value: "500K+" },
];

export default function Home() {
  const t = useTranslations("landing");

  return (
    <PlatformLayout hideFooter={false}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
        </div>
        <div className="container mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-sm font-medium">
              <Zap className="h-3.5 w-3.5" />
              Powered by Solana
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold gap-2">
                <Link href="/courses">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="/courses">
                  {t("hero.ctaSecondary")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="text-center">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`stats.${stat.key}`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
          {features.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="group relative rounded-2xl border bg-card p-8 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">
                {t(`features.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="container mx-auto px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("testimonials.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("testimonials.subtitle")}
          </p>
        </div>
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {([1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className="rounded-2xl border bg-card p-6 space-y-4"
            >
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                &ldquo;{t(`testimonials.${i}.quote`)}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {t(`testimonials.${i}.name`).charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{t(`testimonials.${i}.name`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`testimonials.${i}.role`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partner logos */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-50">
          {["Solana Foundation", "Superteam", "Helius", "Metaplex"].map((name) => (
            <span key={name} className="text-sm font-medium text-muted-foreground">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("paths.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("paths.subtitle")}
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map(({ id, icon: Icon, color }) => (
              <Link
                key={id}
                href={`/courses?track=${id}`}
                className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className={`rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {trackLabels[id]}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold gap-2">
              <Link href="/courses">
                {t("cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PlatformLayout>
  );
}
