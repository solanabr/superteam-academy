"use client";

import { useTranslations } from "next-intl";
import { formatXP } from "@/lib/utils";

const stats = [
  { key: "learners", value: 1250, suffix: "+" },
  { key: "courses", value: 24, suffix: "" },
  { key: "credentials", value: 856, suffix: "+" },
  { key: "xpEarned", value: 2500000, suffix: "", format: true },
];

export function StatsSection() {
  const t = useTranslations("landing.stats");

  return (
    <section className="py-20 md:py-28">
      <div className="container px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="text-center">
              <div className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stat.format ? formatXP(stat.value) : stat.value}
                {stat.suffix}
              </div>
              <div className="mt-2 text-muted-foreground">{t(stat.key)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
