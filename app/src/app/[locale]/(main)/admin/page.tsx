"use client";

import { useTranslations } from "next-intl";
import { CourseList } from "@/components/admin/course-list";

export default function AdminPage() {
  const t = useTranslations("admin");

  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CourseList />
    </div>
  );
}
