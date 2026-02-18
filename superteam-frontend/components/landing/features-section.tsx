"use client";

import { Code2, Trophy, Shield, Zap, Award, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

const featureKeys: { key: string; descKey: string; icon: LucideIcon }[] = [
  { key: "codeEditor", descKey: "codeEditorDescription", icon: Code2 },
  { key: "gamification", descKey: "gamificationDescription", icon: Trophy },
  {
    key: "onChainCredentials",
    descKey: "onChainCredentialsDescription",
    icon: Award,
  },
  { key: "security", descKey: "securityDescription", icon: Shield },
  { key: "feedback", descKey: "feedbackDescription", icon: Zap },
  { key: "community", descKey: "communityDescription", icon: Users },
];

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section
      id="features"
      className="border-t border-border bg-card/30 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-pretty">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t(feature.key)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
