"use client";

import { Users, BookCheck, Code2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { platformStats } from "@/lib/landing-data";

export function StatsSection() {
  const t = useTranslations("stats");

  const stats = [
    { label: t("developers"), value: platformStats.developers, icon: Users },
    {
      label: t("coursesCompleted"),
      value: platformStats.coursesCompleted,
      icon: BookCheck,
    },
    {
      label: t("challengesSolved"),
      value: platformStats.challengesSolved,
      icon: Code2,
    },
    { label: t("xpAwarded"), value: platformStats.xpAwarded, icon: Zap },
  ];

  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <stat.icon className="mb-3 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground lg:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
