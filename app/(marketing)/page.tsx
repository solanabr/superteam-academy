"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export default function LandingPage(): JSX.Element {
  const { t } = useI18n();

  const pathKeys = ["foundations", "programs", "fullstack"] as const;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10">
      <section className="space-y-5">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">{t("landing.heroTitle")}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t("landing.heroSubtitle")}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/courses">{t("landing.primaryCta")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">
              {t("landing.secondaryCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t("landing.pathTitle")}</h2>
        <p className="text-muted-foreground">{t("landing.pathSubtitle")}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {pathKeys.map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>{t(`landing.paths.${key}.title`)}</CardTitle>
                <CardDescription>{t(`landing.paths.${key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/courses">{t("landing.primaryCta")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
