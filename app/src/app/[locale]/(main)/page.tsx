import { Suspense } from "react";
import Image from "next/image";
import { RemoteImage } from "@/components/remote-image";
import { HeroSolanaLogo } from "@/components/hero-solana-logo";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LearningPathsRandom } from "@/components/learning-paths-random";
import { getAllCourses } from "@/services/cms";
import { Award, Quote } from "lucide-react";
import { InstructorsCarousel } from "@/components/instructors-carousel";
import { MatrixDigits } from "@/components/matrix-digits";
import { PixelSnake } from "@/components/pixel-snake";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const courses = await getAllCourses();

  const coursesForPaths = courses.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    xpTotal: c.xpTotal,
    thumbnail: c.thumbnail,
    difficulty: c.difficulty,
  }));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <div className="container relative flex flex-col items-center px-6 py-24 text-center md:py-32">
          <h1 className="flex max-w-4xl flex-wrap items-center justify-center gap-2 text-4xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[1.1]">
            <span>{t("heroTitlePrefix")}</span>
            <HeroSolanaLogo />
          </h1>
          <p className="hero-subtitle mt-6 max-w-2xl text-lg leading-relaxed text-neutral-700 dark:text-muted-foreground sm:text-xl">
            {t("heroSubtitleLine2")}
          </p>
          <p className="hero-tech mt-3 font-mono text-lg font-bold text-sky-600 sm:text-xl md:text-2xl">
            {t("heroTech")}
          </p>

          {/* Stats row — animação estilo slot machine 777 */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            <div className="flex flex-col items-center">
              <div className="hero-stats-slot hero-stats-delay-0 h-14 sm:h-16 md:h-20">
                <div className="hero-stats-reel h-full">
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    100+
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    100+
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    100+
                  </span>
                </div>
              </div>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                {t("statsBuilders")}
              </span>
            </div>
            <div className="hidden h-12 w-px bg-border sm:block md:h-14" />
            <div className="flex flex-col items-center">
              <div className="hero-stats-slot hero-stats-delay-1 h-14 sm:h-16 md:h-20">
                <div className="hero-stats-reel h-full">
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    20+
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    20+
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    20+
                  </span>
                </div>
              </div>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                {t("statsEvents")}
              </span>
            </div>
            <div className="hidden h-12 w-px bg-border sm:block md:h-14" />
            <div className="flex flex-col items-center">
              <div className="hero-stats-slot hero-stats-delay-2 h-14 sm:h-16 md:h-20">
                <div className="hero-stats-reel h-full">
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    $293,930
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    $293,930
                  </span>
                  <span className="hero-stats-number block h-14 text-4xl font-black tabular-nums text-[#008c4C] drop-shadow-md sm:h-16 sm:text-5xl md:h-20 md:text-6xl">
                    $293,930
                  </span>
                </div>
              </div>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                {t("statsEarned")}
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="card-button h-12 min-w-[200px] gap-1.5 rounded-xl bg-[hsl(var(--brand-logo-yellow))] px-8 text-base font-semibold text-[hsl(0,0%,9%)] shadow-lg transition-transform hover:bg-[hsl(var(--brand-logo-yellow)/0.85)] active:scale-[0.98]"
            >
              <Link href="/courses" className="focus-visible:outline-none">
                {t("ctaCourses")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[180px] rounded-xl border-2 border-[#008c4C] bg-[#008c4C] px-8 text-base font-medium text-white transition-transform hover:bg-[#006b3a] hover:border-[#006b3a] active:scale-[0.98]"
            >
              <Link href="/challenges" className="focus-visible:outline-none">
                {t("ctaChallenges")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trilhas */}
      <section className="relative py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-4xl">
              {t("learningPaths")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("learningPathsIntro")}
            </p>
          </div>
          <LearningPathsRandom courses={coursesForPaths} />
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-4xl">
              {t("features")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("featuresIntro")}</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Card className="relative overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
              <div className="pointer-events-none absolute inset-0 flex flex-col opacity-[0.22]">
                <MatrixDigits fill />
              </div>
              <CardHeader className="relative z-10 flex flex-col items-center space-y-4 bg-transparent text-center">
                <CardTitle className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_12px_var(--card)]">
                  {t("featuresInteractive")}
                </CardTitle>
                <CardDescription className="leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_8px_var(--card)]">
                  {t("featuresInteractiveDesc")}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center bg-transparent">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  {t("featuresCredentials")}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {t("featuresCredentialsDesc")}
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="relative overflow-hidden rounded-2xl transition-shadow hover:shadow-md">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.22]">
                <div className="scale-[2.5]">
                  <PixelSnake />
                </div>
              </div>
              <CardHeader className="relative z-10 flex flex-col items-center space-y-4 bg-transparent text-center">
                <CardTitle className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_12px_var(--card)]">
                  {t("featuresGamification")}
                </CardTitle>
                <CardDescription className="leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_8px_var(--card)]">
                  {t("featuresGamificationDesc")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Carrossel de instrutores */}
      <section className="relative py-16">
        <InstructorsCarousel
          title={t("instructorsCarouselTitle")}
          subtitle={t("instructorsCarouselSubtitle")}
        />
      </section>

      {/* Testimonials */}
      <section className="relative py-24">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-4xl">
            {t("testimonials")}
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <Card className="rounded-2xl transition-shadow hover:shadow-md">
              <CardHeader>
                <Quote className="h-8 w-8 text-primary/50" />
                <blockquote className="mt-2 text-lg leading-relaxed text-card-foreground">
                  {t("testimonial1Quote")}
                </blockquote>
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  — {t("testimonial1Name")}
                </p>
              </CardHeader>
            </Card>
            <Card className="rounded-2xl transition-shadow hover:shadow-md">
              <CardHeader>
                <Quote className="h-8 w-8 text-primary/50" />
                <blockquote className="mt-2 text-lg leading-relaxed text-card-foreground">
                  {t("testimonial2Quote")}
                </blockquote>
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  — {t("testimonial2Name")}
                </p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners & Ecosystem */}
      <section className="relative py-24">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-4xl">
            {t("partners")}
          </h2>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[
              {
                name: "Solana Foundation",
                logo: "/images/foundation.png",
                width: 320,
                height: 96,
                url: "https://solana.org",
              },
              {
                name: "Metaplex",
                logo: "/images/metaplex.webp",
                width: 1080,
                height: 1080,
                url: "https://metaplex.com",
                sizeClass: "h-48",
              },
              {
                name: "Helius",
                logo: "/images/logo helius.png",
                width: 260,
                height: 80,
                url: "https://helius.dev",
                extraClass: "dark:invert",
              },
              {
                name: "Jupiter",
                logo: "/images/jupiter.webp",
                width: 260,
                height: 80,
                url: "https://jup.ag",
              },
              {
                name: "Solflare",
                logo: "/images/Solflare-Logo-New.png",
                width: 280,
                height: 80,
                url: "https://solflare.com",
              },
              {
                name: "Superteam",
                logo: "/images/st.svg",
                width: 720,
                height: 640,
                url: "https://superteam.fun",
              },
            ].map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  className={`${partner.sizeClass ?? "h-12"} w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 ${partner.extraClass ?? ""}`}
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-3xl border-2 border-primary/30 bg-primary/5 px-8 py-16 text-center transition-shadow hover:shadow-lg dark:border-[hsl(var(--brand-logo-yellow))] dark:bg-[#008c4C]/80">
            <h2 className="text-2xl font-bold tracking-tight text-[#008c4C] drop-shadow-md dark:text-[hsl(var(--brand-logo-yellow))] sm:text-3xl">
              {t("ctaFinalTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground dark:text-white">
              {t("ctaFinalSubtitle")}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-xl bg-[hsl(var(--brand-logo-yellow))] px-8 font-semibold text-[hsl(0,0%,9%)] transition-transform hover:bg-[hsl(var(--brand-logo-yellow)/0.85)] active:scale-[0.98]"
            >
              <Link href="/dashboard" className="focus-visible:outline-none">
                {t("ctaFinalButton")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
