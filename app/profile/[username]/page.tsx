"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillRadar } from "@/components/shared/SkillRadar";
import { useEffect, useState } from "react";
import type { CmsCourse } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default function ProfilePage({ params }: ProfilePageProps): JSX.Element {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CmsCourse[]>([]);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCourses(json.courses);
    };
    void run();
  }, []);

  const skills = [
    { label: "Solana", value: 84 },
    { label: "Anchor", value: 78 },
    { label: "TypeScript", value: 82 },
    { label: "Rust", value: 64 },
    { label: "Testing", value: 71 },
    { label: "Security", value: 69 }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      <section className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted text-xl font-semibold uppercase">
          {params.username.slice(0, 2)}
        </div>
        <div>
          <h1 className="text-3xl font-bold">@{params.username}</h1>
          <p className="text-sm text-muted-foreground">{t("profile.title")}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.skills")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillRadar values={skills} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.credentials")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md border p-3">Solana Foundations Credential · Devnet cNFT</div>
            <div className="rounded-md border p-3">Anchor Programs Credential · Devnet cNFT</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.completedCourses")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article key={course.slug} className="rounded-md border p-3">
              <p className="font-medium">{course.title}</p>
              <p className="text-xs text-muted-foreground">{course.xpReward} XP</p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
