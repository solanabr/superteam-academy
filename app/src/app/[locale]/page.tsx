import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { LandingNewsletterSignup } from "@/components/landing/LandingNewsletterSignup";
import { ArrowRight, BookOpen, Briefcase, Code2, Medal, Sparkles, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { FeatureCard } from "@/components/ui/feature-card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { courses } from "@/lib/data/courses";
import { devlabQuests } from "@/lib/data/devlab-quests";
import { locales } from "@/lib/i18n/routing";

export const revalidate = 3600;

const socialProofQuotes = [
  {
    quote: 'Think "Codecademy meets Cyfrin Updraft" for Solana.',
    source: "Superteam Brazil grant brief",
  },
  {
    quote: "Gamified progression, interactive coding challenges, on-chain credentials.",
    source: "Grant product scope",
  },
  {
    quote: "Built to be open-source, forkable, and community-driven from day one.",
    source: "Submission requirement",
  },
];

const ecosystemLinks = [
  { name: "Solana", href: "https://solana.com" },
  { name: "Superteam Brazil", href: "https://x.com/SuperteamBR" },
  { name: "Helius", href: "https://www.helius.dev" },
  { name: "Vercel", href: "https://vercel.com" },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const tNav = useTranslations("nav");
  const tLeaderboard = useTranslations("leaderboard");
  const courseCount = courses.length;
  const localeCount = locales.length;
  const devlabTrackCount = devlabQuests.length;

  return (
    <PageShell
      hero={
        <PageHeader
          badge={{ variant: "brand", icon: Sparkles, label: t("heroBadge") }}
          title={t("heroTitle")}
          description={t("heroSubtitle")}
          actions={
            <>
              <Link href="/courses">
                <Button className="gap-2 rounded-xl">
                  {t("heroCTA")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/playground">
                <Button variant="outline" className="rounded-xl">
                  {t("heroSecondaryCTA")}
                </Button>
              </Link>
            </>
          }
        />
      }
    >
      <section className="hero-grid">
        <MarketplaceCard accent className="h-full">
          <CardContent className="space-y-5 p-6 md:p-7">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("featuresTitle")}</p>
              <p className="text-sm leading-6 text-muted-foreground">{t("featureCommunityDesc")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                {tNav("courses")}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                {tNav("playground")}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                {tNav("devlab")}
              </Badge>
              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                {tNav("leaderboard")}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("statsCourses")}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{courseCount}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tNav("language")}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{localeCount}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tNav("devlab")}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{devlabTrackCount}</p>
              </div>
            </div>
          </CardContent>
        </MarketplaceCard>

        <MarketplaceCard accent className="h-full">
          <CardContent className="flex h-full flex-col gap-5 p-6 md:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">{t("playgroundTitle")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("playgroundSubtitle")}</p>
            </div>
            <div className="space-y-2">
              {[t("playgroundFeature1"), t("playgroundFeature2"), t("playgroundFeature3")].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground"
                >
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap gap-3">
              <Link href="/courses">
                <Button className="rounded-xl">{t("heroSecondaryCTA")}</Button>
              </Link>
              <Link href="/playground">
                <Button variant="outline" className="rounded-xl">{t("playgroundCTA")}</Button>
              </Link>
            </div>
          </CardContent>
        </MarketplaceCard>
      </section>

      <section className="home-section">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t("featuresTitle")}</h2>
          <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
            {tNav("devlab")}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            href="/courses"
            icon={BookOpen}
            title={tNav("courses")}
            description={t("featureEditorDesc")}
            meta={tc("lessons")}
          />
          <FeatureCard
            href="/playground"
            icon={Code2}
            title={tNav("playground")}
            description={t("playgroundSubtitle")}
            meta={t("playgroundCTA")}
          />
          <FeatureCard
            href="/devlab"
            icon={Sparkles}
            title={tNav("devlab")}
            description={t("devlabSubtitle")}
            meta={t("devlabCTA")}
          />
        </div>
      </section>

      <section className="home-section">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t("featureCommunity")}</h2>
          <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
            {t("statsCommunity")}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            href="/jobs"
            icon={Briefcase}
            title={tNav("jobs")}
            description={t("featureCommunityDesc")}
            meta={tNav("jobs")}
          />
          <FeatureCard
            href="/projects"
            icon={Code2}
            title={tNav("projects")}
            description={t("componentHubSubtitle")}
            meta={tNav("projects")}
          />
          <FeatureCard
            href="/mentors"
            icon={Users}
            title={tNav("mentors")}
            description={t("featureXPDesc")}
            meta={tNav("mentors")}
          />
        </div>
      </section>

      <section className="home-section">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">{tLeaderboard("title")}</h2>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-1 rounded-xl">
              {tc("viewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MarketplaceCard accent className="h-full">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-foreground">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{tNav("leaderboard")}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{tLeaderboard("subtitle")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                  {t("statsStudents")}
                </Badge>
                <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                  {t("featureXP")}
                </Badge>
              </div>
            </CardContent>
          </MarketplaceCard>

          <MarketplaceCard accent className="h-full">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-foreground">
                <Medal className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{t("featureCredentials")}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{t("featureCredentialsDesc")}</p>
              </div>
              <div className="space-y-2">
                <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("featureCredentials")}</p>
                  <p className="mt-1 text-sm text-foreground">{t("featureCredentialsDesc")}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("featureXP")}</p>
                  <p className="mt-1 text-sm text-foreground">{t("featureXPDesc")}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tNav("leaderboard")}</p>
                  <p className="mt-1 text-sm text-foreground">{tLeaderboard("subtitle")}</p>
                </div>
              </div>
            </CardContent>
          </MarketplaceCard>
        </div>
      </section>

      <section id="testimonials" className="home-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{t("testimonialTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              Product language and positioning pulled directly from the Superteam Brazil grant brief.
            </p>
          </div>
          <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
            Open-source scope
          </Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {socialProofQuotes.map((item) => (
            <MarketplaceCard key={item.quote} accent className="h-full">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <p className="text-base leading-7 text-foreground">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <p className="mt-auto text-sm text-muted-foreground">{item.source}</p>
              </CardContent>
            </MarketplaceCard>
          ))}
        </div>
      </section>

      <section id="ecosystem" className="home-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Ecosystem</h2>
            <p className="text-sm text-muted-foreground">
              The current build is aligned with the Solana-native stack it already integrates: wallet
              adapters, Devnet, analytics, deployment, and on-chain indexing.
            </p>
          </div>
          <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
            Real integrations
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ecosystemLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[1.5rem] border border-border/70 bg-card/80 p-5 transition-colors hover:bg-muted/20"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ecosystem</p>
              <p className="mt-3 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {item.name}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section id="newsletter" className="home-section">
        <MarketplaceCard accent className="overflow-hidden">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] md:p-7">
            <div className="space-y-3">
              <Badge variant="outline" className="border-border/70 bg-background/70 text-muted-foreground">
                Newsletter
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">Follow product updates</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Subscribe for release notes, new course launches, DevLab updates, and grant-delivery milestones.
              </p>
              <p className="text-xs text-muted-foreground">
                This signup stores only your email and signup source in the app database.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-4">
              <LandingNewsletterSignup
                buttonLabel="Join updates"
                pendingLabel="Joining..."
                placeholder="Email address"
                successTitle="Subscription saved"
                successDescription="You are on the Superteam Academy updates list."
              />
            </div>
          </CardContent>
        </MarketplaceCard>
      </section>
    </PageShell>
  );
}
