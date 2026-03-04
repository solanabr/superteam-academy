"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen, Wallet, Palette, Gamepad2, Server, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const learningPaths = [
  {
    id: "fundamentals",
    icon: BookOpen,
    courses: 5,
    duration: "20h",
    color: "bg-[hsl(var(--track-fundamentals))]",
  },
  {
    id: "defi",
    icon: Wallet,
    courses: 4,
    duration: "25h",
    color: "bg-[hsl(var(--track-defi))]",
  },
  {
    id: "nft",
    icon: Palette,
    courses: 3,
    duration: "15h",
    color: "bg-[hsl(var(--track-nft))]",
  },
  {
    id: "gaming",
    icon: Gamepad2,
    courses: 3,
    duration: "18h",
    color: "bg-[hsl(var(--track-gaming))]",
  },
  {
    id: "infrastructure",
    icon: Server,
    courses: 4,
    duration: "22h",
    color: "bg-[hsl(var(--track-infrastructure))]",
  },
  {
    id: "security",
    icon: Shield,
    courses: 3,
    duration: "20h",
    color: "bg-[hsl(var(--track-security))]",
  },
];

export function LearningPathsSection() {
  const t = useTranslations("landing.paths");
  const tTracks = useTranslations("courses.tracks");

  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <Card
              key={path.id}
              className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${path.color}`}
                  >
                    <path.icon className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant={path.id as "fundamentals" | "defi" | "nft" | "gaming" | "infrastructure" | "security"}>
                    {path.courses} courses
                  </Badge>
                </div>
                <CardTitle className="mt-4">{tTracks(path.id)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{path.duration} total</span>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span> 4.9
                  </span>
                </div>
                <Progress value={0} className="h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Start your journey
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/courses">
              View All Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
