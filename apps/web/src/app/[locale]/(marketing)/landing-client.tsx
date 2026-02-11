"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { TerminalTypewriter } from "@/components/landing/terminal-typewriter";
import { createClient } from "@/lib/supabase/client";

export function LandingPageClient() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      idx: "01",
      accentColor: "border-l-primary",
      labelColor: "text-primary",
      title: t("featureCodeTitle"),
      description: t("featureCodeDesc"),
    },
    {
      idx: "02",
      accentColor: "border-l-secondary",
      labelColor: "text-secondary",
      title: t("featureCertsTitle"),
      description: t("featureCertsDesc"),
    },
    {
      idx: "03",
      accentColor: "border-l-accent",
      labelColor: "text-accent",
      title: t("featureXpTitle"),
      description: t("featureXpDesc"),
    },
    {
      idx: "04",
      accentColor: "border-l-success",
      labelColor: "text-success",
      title: t("featureOssTitle"),
      description: t("featureOssDesc"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Background atmosphere */}
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="bg-primary/8 absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full blur-[140px]" />
            <div className="bg-accent/6 absolute -bottom-20 -left-20 h-[500px] w-[500px] rounded-full blur-[120px]" />
            {/* Dot grid texture */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--text) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="container px-4 pb-20 pt-16 md:pb-28 md:pt-28">
            <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
              {/* Left — Copy */}
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-md border-[2.5px] border-border bg-card px-3 py-2 shadow-push-sm">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-3">
                    {t("poweredBy")}
                  </span>
                  <Image
                    src="/ST-DARK-GREEN-HORIZONTAL.png"
                    alt="Superteam Brasil"
                    width={120}
                    height={24}
                    className="h-5 w-auto dark:hidden"
                  />
                  <Image
                    src="/ST-YELLOW-HORIZONTAL.png"
                    alt="Superteam Brasil"
                    width={120}
                    height={24}
                    className="hidden h-5 w-auto dark:block"
                  />
                </div>

                <h1 className="mb-5 font-display text-5xl font-black leading-[0.95] tracking-tight text-text md:text-6xl lg:text-7xl">
                  {t("heroTitle")}
                </h1>

                <p className="mb-2 max-w-md text-lg leading-relaxed text-text-2">
                  {t("heroSubtitle")}
                </p>
                <p className="mb-8 max-w-md text-base text-text-3">
                  {t("heroSubtitle2")}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button variant="push" size="lg" asChild>
                    <Link href={`/${locale}/courses`}>
                      {t("exploreCourses")} {"\u2192"}
                    </Link>
                  </Button>
                  {!isLoggedIn && (
                    <AuthModal
                      trigger={
                        <Button variant="outline" size="lg">
                          {tCommon("signUp")}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Right — Animated terminal card */}
              <div className="hidden md:block" aria-hidden="true">
                <TerminalTypewriter />
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-subtle/50 border-y-[2.5px] border-border">
          <div className="container px-4 py-20 md:py-28">
            <div className="mb-14 flex items-end justify-between">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                {t("featuresTitle")}
              </h2>
              <div className="hidden text-sm font-medium text-text-3 md:block">
                &#47;&#47; what sets us apart
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`group rounded-lg border-[2.5px] border-l-[4px] border-border ${feature.accentColor} bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-hover hover:shadow-card-hover`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className={`font-mono text-xs font-bold ${feature.labelColor}`}
                    >
                      {feature.idx}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="mb-1.5 font-display text-lg font-extrabold">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-3">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA — Ink Teal dark panel ── */}
        <section className="relative overflow-hidden bg-secondary">
          {/* Subtle noise overlay for texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Glow orb */}
          <div
            className="bg-primary/10 absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full blur-[100px]"
            aria-hidden="true"
          />

          <div className="container relative px-4 py-20 text-center md:py-28">
            <h2 className="mb-3 font-display text-3xl font-bold text-white md:text-5xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mb-8 max-w-md text-lg text-white/60">
              {t("ctaSubtitle")}
            </p>
            {!isLoggedIn && (
              <AuthModal
                trigger={
                  <Button
                    variant="pushAccent"
                    size="lg"
                    className="text-secondary"
                  >
                    {tCommon("getStarted")} {"\u2192"}
                  </Button>
                }
              />
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
