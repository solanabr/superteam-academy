"use client";

import { useTranslations } from "next-intl";
import { Code, Award, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    key: "interactive",
    icon: Code,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    key: "credentials",
    icon: Award,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    key: "gamification",
    icon: Trophy,
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    key: "community",
    icon: Users,
    gradient: "from-green-500 to-emerald-500",
  },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section className="py-20 md:py-28">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.key}
              className="group relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-muted transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${feature.key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
