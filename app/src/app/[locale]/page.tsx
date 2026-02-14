import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Trophy,
  Users,
  Zap,
  BookOpen,
  Shield,
  Globe,
  Rocket,
  ChevronRight,
  Star
} from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale/LocaleSwitcher";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            <span>Superteam Academy</span>
          </div>
          <nav className="flex items-center gap-6 ml-8 text-sm">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("navigation.courses")}
            </Link>
            <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("navigation.leaderboard")}
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("navigation.about")}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />
            <Button>{t("navigation.connectWallet")}</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          <Star className="h-3 w-3 mr-1" />
          {t("home.badge")}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
          {t("home.title")}
          <span className="text-primary">{t("home.titleHighlight")}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          {t("home.subtitle")}
        </p>
        <div className="flex gap-4 mt-8">
          <Button size="lg" className="gap-2">
            {t("home.cta")}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            {t("home.viewCourses")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">10+</span>
            <span className="text-sm text-muted-foreground">{t("home.stats.courses")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">1,000+</span>
            <span className="text-sm text-muted-foreground">{t("home.stats.learners")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">500+</span>
            <span className="text-sm text-muted-foreground">{t("home.stats.credentials")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">3</span>
            <span className="text-sm text-muted-foreground">{t("home.stats.languages")}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("home.whyTitle")}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Code2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.codeEditor.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.codeEditor.description")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.gamified.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.gamified.description")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.credentials.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.credentials.description")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.projectBased.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.projectBased.description")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.multilingual.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.multilingual.description")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("home.features.community.title")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {t("home.features.community.description")}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Learning Tracks */}
      <section className="container py-16 bg-muted/50 -mx-4 px-4 w-screen">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t("home.tracks.title")}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t("home.tracks.subtitle")}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <Badge className="w-fit bg-green-500">{t("home.tracks.beginner")}</Badge>
                <CardTitle className="mt-2">{t("home.tracks.foundations.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    {t("home.tracks.foundations.intro")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    {t("home.tracks.foundations.wallet")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    {t("home.tracks.foundations.transaction")}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <Badge className="w-fit bg-yellow-500">{t("home.tracks.intermediate")}</Badge>
                <CardTitle className="mt-2">{t("home.tracks.anchor.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {t("home.tracks.anchor.basics")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {t("home.tracks.anchor.pdas")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {t("home.tracks.anchor.testing")}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <Badge className="w-fit bg-red-500">{t("home.tracks.advanced")}</Badge>
                <CardTitle className="mt-2">{t("home.tracks.defi.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-500" />
                    {t("home.tracks.defi.token2022")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-500" />
                    {t("home.tracks.defi.amm")}
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-red-500" />
                    {t("home.tracks.defi.security")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">{t("home.ctaSection.title")}</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          {t("home.ctaSection.subtitle")}
        </p>
        <Button size="lg" className="gap-2">
          <Rocket className="h-4 w-4" />
          {t("home.ctaSection.button")}
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Superteam Academy</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">{t("footer.terms")}</Link>
            <Link href="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link>
            <Link href="https://github.com/solanabr/superteam-academy" className="hover:text-foreground">GitHub</Link>
            <Link href="https://twitter.com/SuperteamBR" className="hover:text-foreground">Twitter</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("footer.builtBy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
